package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.MachineRepository;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final MachineRepository machineRepository;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository, MachineRepository machineRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.machineRepository = machineRepository;
        this.userRepository = userRepository;
    }

    public Booking createBooking(String username, Long machineId, LocalDate startDate, LocalDate endDate) {
        if (machineId == null || startDate == null || endDate == null) {
            throw new IllegalArgumentException("Machine and booking dates are required");
        }
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot book in the past");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));

        if (!"AVAILABLE".equals(machine.getStatus())) {
            throw new IllegalArgumentException("This machine is currently not available for rent");
        }
        if (bookingRepository.existsByMachineIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                machineId, Set.of("PENDING", "APPROVED"), endDate, startDate)) {
            throw new IllegalArgumentException("This machine is already booked for the selected dates");
        }

        // Calculate cost (Adding 1 so same-day returns count as 1 day)
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        double totalCost = days * machine.getDailyRate();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setMachine(machine);
        booking.setStartDate(startDate);
        booking.setEndDate(endDate);
        booking.setTotalCost(totalCost);
        booking.setStatus("PENDING");

        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Booking> getMyBookings(String username) {
        return bookingRepository.findByUserUsernameOrderByCreatedAtDesc(username);
    }

    public Booking updateBookingStatus(Long bookingId, String username, String role, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Booking status is required");
        }
        String newStatus = status.trim().toUpperCase();
        switch (role) {
            case "CUSTOMER" -> {
                if (!booking.getUser().getUsername().equals(username) || !"PENDING".equals(booking.getStatus()) || !"CANCELED".equals(newStatus)) {
                    throw new IllegalArgumentException("Customers can only cancel their own pending bookings");
                }
            }
            case "ADMIN" -> {
                if (!Set.of("APPROVED", "REJECTED", "COMPLETED").contains(newStatus)) {
                    throw new IllegalArgumentException("Invalid admin booking status");
                }
            }
            default -> throw new IllegalArgumentException("You are not allowed to update bookings");
        }
        booking.setStatus(newStatus);

        // If approved, mark the machine as rented
        if ("APPROVED".equals(newStatus)) {
            Machine machine = booking.getMachine();
            machine.setStatus("RENTED");
            machineRepository.save(machine);
        }
        // If completed or rejected, free up the machine
        else if ("COMPLETED".equals(newStatus) || "REJECTED".equals(newStatus) || "CANCELED".equals(newStatus)) {
            Machine machine = booking.getMachine();
            machine.setStatus("AVAILABLE");
            machineRepository.save(machine);
        }

        return bookingRepository.save(booking);
    }
}
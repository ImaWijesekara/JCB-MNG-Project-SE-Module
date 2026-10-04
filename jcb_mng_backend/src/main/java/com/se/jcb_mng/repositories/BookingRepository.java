package com.se.jcb_mng.repositories;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.se.jcb_mng.entities.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Allows customers to see only their own bookings
    List<Booking> findByUserUsernameOrderByCreatedAtDesc(String username);

    // For Admins to see latest bookings first
    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(String status);

    boolean existsByMachineId(Long machineId);

    boolean existsByMachineIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long machineId,
            Collection<String> statuses,
            LocalDate endDate,
            LocalDate startDate);

    List<Booking> findByStatusAndEndDateGreaterThanEqualAndEndDateLessThan(
            String status, LocalDate startDate, LocalDate endDate);
}
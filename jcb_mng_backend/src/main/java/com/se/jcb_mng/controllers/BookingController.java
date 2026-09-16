package com.se.jcb_mng.controllers;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.services.BookingService;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    public record BookingRequest(Long machineId, String startDate, String endDate) {}

    @PostMapping("/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createBooking(Authentication auth, @RequestBody BookingRequest request) {
        try {
            if (request == null || request.startDate() == null || request.endDate() == null) {
                throw new IllegalArgumentException("Booking dates are required");
            }
            Booking booking = bookingService.createBooking(
                    auth.getName(),
                    request.machineId(),
                    LocalDate.parse(request.startDate()),
                    LocalDate.parse(request.endDate())
            );
            return ResponseEntity.ok(toResponse(booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication auth) {
        return ResponseEntity.ok(bookingService.getMyBookings(auth.getName())
                .stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings()
                .stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')") // Customer can cancel, Admin can approve/reject
        public ResponseEntity<?> updateStatus(Authentication auth, @PathVariable Long id, @RequestParam String status) {
        try {
            String role = auth.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("");
            Booking booking = bookingService.updateBookingStatus(id, auth.getName(), role, status);
            return ResponseEntity.ok(toResponse(booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private BookingResponse toResponse(Booking b) {
        return new BookingResponse(
                b.getId(),
                b.getUser().getUsername(),
                b.getMachine().getName() + " (" + b.getMachine().getModelName() + ")",
                b.getStartDate().toString(),
                b.getEndDate().toString(),
                b.getTotalCost(),
                b.getStatus()
        );
    }

    public record BookingResponse(Long id, String customerName, String machineDetails, String startDate, String endDate, Double totalCost, String status) {}
}
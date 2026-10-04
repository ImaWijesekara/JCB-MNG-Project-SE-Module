package com.se.jcb_mng.repositories;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;

import com.se.jcb_mng.entities.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // Find all payments for a specific customer
    List<Payment> findByBookingUserUsernameOrderByPaymentDateDesc(String username);

    // Admin / Finance Officer views
    List<Payment> findAllByOrderByPaymentDateDesc();

    // Prevent duplicate payments on the same booking
    boolean existsByBookingId(Long bookingId);

    Optional<Payment> findByBookingId(Long bookingId);

    boolean existsByBookingIdAndStatus(Long bookingId, String status);

    List<Payment> findByStatusAndPaymentDateGreaterThanEqualAndPaymentDateLessThan(
            String status, LocalDateTime startDate, LocalDateTime endDate);
}
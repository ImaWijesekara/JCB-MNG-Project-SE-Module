package com.se.jcb_mng.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.se.jcb_mng.entities.Payment;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // Find all payments for a specific customer
    List<Payment> findByBookingUserUsernameOrderByPaymentDateDesc(String username);

    // Admin / Finance Officer views
    List<Payment> findAllByOrderByPaymentDateDesc();

    // Prevent duplicate payments on the same booking
    boolean existsByBookingId(Long bookingId);
}
package com.se.jcb_mng.services;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.Payment;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.PaymentRepository;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    public PaymentService(PaymentRepository paymentRepository, BookingRepository bookingRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
    }

    public Payment processPayment(String username, Long bookingId, String paymentMethod) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Booking is required");
        }
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new IllegalArgumentException("Payment method is required");
        }
        String normalizedMethod = paymentMethod.trim().toUpperCase();
        if (!Set.of("CARD", "BANK_TRANSFER", "CASH").contains(normalizedMethod)) {
            throw new IllegalArgumentException("Invalid payment method");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // Security check: Make sure the customer owns this booking
        if (!booking.getUser().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can only pay for your own bookings");
        }

        if (!"APPROVED".equals(booking.getStatus())) {
            throw new IllegalArgumentException("You can only pay for APPROVED bookings");
        }

        if (paymentRepository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException("A payment already exists for this booking");
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getTotalCost()); // Auto-pull price from booking
        payment.setPaymentMethod(normalizedMethod);
        payment.setStatus("PENDING"); // Requires Finance Officer approval

        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc();
    }

    public List<Payment> getMyPayments(String username) {
        return paymentRepository.findByBookingUserUsernameOrderByPaymentDateDesc(username);
    }

    public Payment updatePaymentStatus(Long paymentId, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Payment status is required");
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!Set.of("COMPLETED", "FAILED").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Payment status must be COMPLETED or FAILED");
        }
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!"PENDING".equals(payment.getStatus())) {
            throw new IllegalArgumentException("Only pending payments can be updated");
        }
        payment.setStatus(normalizedStatus);
        return paymentRepository.save(payment);
    }

    public void deletePayment(Long paymentId) {
        if (paymentId == null) {
            throw new IllegalArgumentException("Payment ID is required");
        }
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if ("COMPLETED".equals(payment.getStatus())) {
            throw new IllegalArgumentException("Completed payments cannot be deleted");
        }
        paymentRepository.delete(payment);
    }
}
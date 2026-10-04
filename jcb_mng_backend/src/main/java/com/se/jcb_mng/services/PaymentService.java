package com.se.jcb_mng.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.Payment;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.InvoiceRepository;
import com.se.jcb_mng.repositories.PaymentRepository;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional
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

        var invoice = invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("An invoice must be issued before payment"));
        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new IllegalArgumentException("Only unpaid invoices can be paid");
        }

        var existingPayment = paymentRepository.findByBookingId(bookingId);
        Payment payment;
        if (existingPayment.isPresent()) {
            payment = existingPayment.get();
            if ("PENDING".equals(payment.getStatus()) || "COMPLETED".equals(payment.getStatus())) {
                throw new IllegalArgumentException("A payment is already pending or completed for this invoice");
            }
        } else {
            payment = new Payment();
        }
        payment.setBooking(booking);
        payment.setAmount(invoice.getAmount());
        payment.setPaymentMethod(normalizedMethod);
        payment.setStatus("PENDING");
        payment.setPaymentDate(LocalDateTime.now());

        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc();
    }

    public List<Payment> getMyPayments(String username) {
        return paymentRepository.findByBookingUserUsernameOrderByPaymentDateDesc(username);
    }

    @Transactional
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
        if ("COMPLETED".equals(normalizedStatus)) {
            var invoice = invoiceRepository.findByBookingId(payment.getBooking().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Invoice not found for payment"));
            if (!"UNPAID".equals(invoice.getStatus())) {
                throw new IllegalArgumentException("Only unpaid invoices can be settled");
            }
            invoice.setStatus("PAID");
            invoiceRepository.save(invoice);
            payment.setPaymentDate(LocalDateTime.now());
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
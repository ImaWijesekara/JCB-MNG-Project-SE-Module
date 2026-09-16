package com.se.jcb_mng.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.se.jcb_mng.entities.Payment;
import com.se.jcb_mng.services.PaymentService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    public record PaymentRequest(Long bookingId, String paymentMethod) {}

    @PostMapping("/pay")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> makePayment(Authentication auth, @RequestBody PaymentRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Payment details are required");
            }
            Payment payment = paymentService.processPayment(auth.getName(), request.bookingId(), request.paymentMethod());
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments().stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(Authentication auth) {
        return ResponseEntity.ok(paymentService.getMyPayments(auth.getName()).stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Payment payment = paymentService.updatePaymentStatus(id, status);
            return ResponseEntity.ok(toResponse(payment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return ResponseEntity.ok("Payment deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getBooking().getId(),
                p.getBooking().getUser().getUsername(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getPaymentDate().toString()
        );
    }

    public record PaymentResponse(Long id, Long bookingId, String customerName, Double amount, String paymentMethod, String status, String date) {}
}
package com.se.jcb_mng.controllers;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.Invoice;
import com.se.jcb_mng.services.InvoiceService;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public record InvoiceRequest(Long bookingId, String dueDate, String description, String notes) {}
    public record InvoiceUpdateRequest(String dueDate, String description, String notes) {}
    public record BookingOption(Long id, String machineDetails, String customerName,
                                String startDate, String endDate, Double totalCost) {}

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Invoice>> getMyInvoices(Authentication authentication) {
        return ResponseEntity.ok(invoiceService.getInvoicesForCustomer(authentication.getName()));
    }

    @GetMapping("/eligible-bookings")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<BookingOption>> getEligibleBookings() {
        List<BookingOption> options = invoiceService.getEligibleBookings().stream()
                .map(this::toBookingOption)
                .toList();
        return ResponseEntity.ok(options);
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<?> createInvoice(@RequestBody InvoiceRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Booking is required");
            }
            return ResponseEntity.ok(invoiceService.createInvoice(
                    request.bookingId(), parseDate(request.dueDate()), request.description(), request.notes()));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<?> updateInvoice(@PathVariable Long id, @RequestBody InvoiceUpdateRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Invoice details are required");
            }
            return ResponseEntity.ok(invoiceService.updateInvoice(
                    id, parseDate(request.dueDate()), request.description(), request.notes()));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<?> voidInvoice(@PathVariable Long id) {
        try {
            invoiceService.voidInvoice(id);
            return ResponseEntity.ok("Invoice voided successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private BookingOption toBookingOption(Booking booking) {
        String customerName = booking.getUser().getFullName() == null || booking.getUser().getFullName().isBlank()
                ? booking.getUser().getUsername()
                : booking.getUser().getFullName();
        return new BookingOption(
                booking.getId(),
                booking.getMachine().getName() + " (" + booking.getMachine().getModelName() + ")",
                customerName,
                booking.getStartDate().toString(),
                booking.getEndDate().toString(),
                booking.getTotalCost());
    }

    private LocalDate parseDate(String date) {
        return date == null || date.isBlank() ? null : LocalDate.parse(date);
    }
}

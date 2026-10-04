package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.Invoice;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.InvoiceRepository;
import com.se.jcb_mng.repositories.PaymentRepository;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          BookingRepository bookingRepository,
                          PaymentRepository paymentRepository) {
        this.invoiceRepository = invoiceRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByIssueDateDesc();
    }

    public List<Invoice> getInvoicesForCustomer(String username) {
        return invoiceRepository.findByCustomerUsernameOrderByIssueDateDesc(username);
    }

    public List<Booking> getEligibleBookings() {
        return bookingRepository.findByStatusOrderByCreatedAtDesc("APPROVED").stream()
                .filter(booking -> !invoiceRepository.existsByBookingId(booking.getId()))
                .toList();
    }

    @Transactional
    public Invoice createInvoice(Long bookingId) {
        return createInvoice(
                bookingId,
                LocalDate.now().plusDays(30),
                "Equipment rental for booking #" + bookingId,
                null);
    }

    @Transactional
    public Invoice createInvoice(Long bookingId, LocalDate dueDate, String description, String notes) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Booking is required");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!"APPROVED".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Invoices can only be issued for approved bookings");
        }
        if (invoiceRepository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException("An invoice already exists for this booking");
        }

        Invoice invoice = new Invoice();
        invoice.setBookingId(booking.getId());
        invoice.setCustomerName(booking.getUser().getFullName() == null
                || booking.getUser().getFullName().isBlank()
                ? booking.getUser().getUsername()
                : booking.getUser().getFullName());
        invoice.setCustomerUsername(booking.getUser().getUsername());
        invoice.setAmount(booking.getTotalCost());
        invoice.setIssueDate(LocalDate.now());
        invoice.setDueDate(validateDueDate(invoice.getIssueDate(), dueDate));
        invoice.setDescription(validateDescription(description));
        invoice.setNotes(validateNotes(notes));
        invoice.setStatus("UNPAID");

        Invoice savedInvoice = invoiceRepository.save(invoice);
        savedInvoice.setInvoiceNumber(String.format("INV-%d-%06d", savedInvoice.getIssueDate().getYear(), savedInvoice.getId()));
        return invoiceRepository.save(savedInvoice);
    }

    @Transactional
    public Invoice updateInvoice(Long invoiceId, LocalDate dueDate, String description, String notes) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new IllegalArgumentException("Only unpaid invoices can be edited");
        }

        invoice.setDueDate(validateDueDate(invoice.getIssueDate(), dueDate));
        invoice.setDescription(validateDescription(description));
        invoice.setNotes(validateNotes(notes));
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice markPaid(Long bookingId) {
        Invoice invoice = invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found for payment booking"));
        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new IllegalArgumentException("Only unpaid invoices can be settled");
        }
        invoice.setStatus("PAID");
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void voidInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new IllegalArgumentException("Only unpaid invoices can be voided");
        }
        if (paymentRepository.existsByBookingIdAndStatus(invoice.getBookingId(), "PENDING")) {
            throw new IllegalArgumentException("Invoices with pending payments cannot be voided");
        }
        invoice.setStatus("VOID");
        invoiceRepository.save(invoice);
    }

    private LocalDate validateDueDate(LocalDate issueDate, LocalDate dueDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Invoice due date is required");
        }
        if (dueDate.isBefore(issueDate)) {
            throw new IllegalArgumentException("Invoice due date cannot be before the issue date");
        }
        return dueDate;
    }

    private String validateDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Invoice description is required");
        }
        String normalized = description.trim();
        if (normalized.length() > 500) {
            throw new IllegalArgumentException("Invoice description must be 500 characters or fewer");
        }
        return normalized;
    }

    private String validateNotes(String notes) {
        if (notes != null && notes.length() > 2000) {
            throw new IllegalArgumentException("Invoice notes must be 2000 characters or fewer");
        }
        return notes == null || notes.isBlank() ? null : notes.trim();
    }
}
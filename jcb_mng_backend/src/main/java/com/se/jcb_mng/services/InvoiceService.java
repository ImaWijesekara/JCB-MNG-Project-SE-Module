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
        invoice.setStatus("UNPAID");

        Invoice savedInvoice = invoiceRepository.save(invoice);
        savedInvoice.setInvoiceNumber(String.format("INV-%d-%06d", savedInvoice.getIssueDate().getYear(), savedInvoice.getId()));
        return invoiceRepository.save(savedInvoice);
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
}
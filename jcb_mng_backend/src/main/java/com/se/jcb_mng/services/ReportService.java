package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.dto.MonthlyReportDTO;
import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.OperatorTask;
import com.se.jcb_mng.entities.Payment;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.OperatorTaskRepository;
import com.se.jcb_mng.repositories.PaymentRepository;

@Service
public class ReportService {

    private static final int REPORT_MONTHS = 12;
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final OperatorTaskRepository operatorTaskRepository;

    public ReportService(PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            OperatorTaskRepository operatorTaskRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.operatorTaskRepository = operatorTaskRepository;
    }

    public List<MonthlyReportDTO> getMonthlyReports() {
        YearMonth currentMonth = YearMonth.now();
        YearMonth firstMonth = currentMonth.minusMonths(REPORT_MONTHS - 1);
        LocalDate firstDate = firstMonth.atDay(1);
        LocalDate endDateExclusive = currentMonth.plusMonths(1).atDay(1);

        Map<YearMonth, MonthlyTotals> totalsByMonth = new HashMap<>();
        for (int month = 0; month < REPORT_MONTHS; month++) {
            totalsByMonth.put(firstMonth.plusMonths(month), new MonthlyTotals());
        }

        LocalDateTime startDateTime = firstDate.atStartOfDay();
        LocalDateTime endDateTime = endDateExclusive.atStartOfDay();
        List<Payment> completedPayments = paymentRepository
                .findByStatusAndPaymentDateGreaterThanEqualAndPaymentDateLessThan(
                        "COMPLETED", startDateTime, endDateTime);
        for (Payment payment : completedPayments) {
            addRevenue(totalsByMonth, YearMonth.from(payment.getPaymentDate()), payment.getAmount());
        }

        List<Booking> completedBookings = bookingRepository
                .findByStatusAndEndDateGreaterThanEqualAndEndDateLessThan(
                        "COMPLETED", firstDate, endDateExclusive);
        for (Booking booking : completedBookings) {
            totalsByMonth.get(YearMonth.from(booking.getEndDate())).addRental();
        }

        List<OperatorTask> completedMaintenance = operatorTaskRepository
                .findByStatusAndServiceDateGreaterThanEqualAndServiceDateLessThan(
                        "COMPLETED", firstDate, endDateExclusive);
        for (OperatorTask task : completedMaintenance) {
            YearMonth month = YearMonth.from(task.getServiceDate());
            totalsByMonth.get(month).addMaintenanceCost(task.getCost());
        }

        return new TreeMap<>(totalsByMonth).descendingMap().entrySet().stream()
                .map(entry -> new MonthlyReportDTO(
                        entry.getKey().format(MONTH_FORMAT),
                        entry.getValue().revenue(),
                        entry.getValue().rentals(),
                        entry.getValue().maintenanceCosts()))
                .toList();
    }

    private void addRevenue(Map<YearMonth, MonthlyTotals> totalsByMonth, YearMonth month, Double amount) {
        MonthlyTotals totals = totalsByMonth.get(month);
        if (totals != null) {
            totals.addRevenue(amount);
        }
    }

    private static final class MonthlyTotals {
        private double revenue;
        private int rentals;
        private double maintenanceCosts;

        private void addRevenue(Double amount) {
            if (amount != null) {
                revenue += amount;
            }
        }

        private void addRental() {
            rentals++;
        }

        private void addMaintenanceCost(Double cost) {
            if (cost != null) {
                maintenanceCosts += cost;
            }
        }

        private double revenue() {
            return revenue;
        }

        private int rentals() {
            return rentals;
        }

        private double maintenanceCosts() {
            return maintenanceCosts;
        }
    }
}

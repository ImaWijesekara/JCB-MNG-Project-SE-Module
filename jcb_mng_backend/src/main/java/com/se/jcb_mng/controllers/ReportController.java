package com.se.jcb_mng.controllers;

import com.se.jcb_mng.dto.MonthlyReportDTO;
import com.se.jcb_mng.services.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<MonthlyReportDTO>> getMonthlyReports() {
        return ResponseEntity.ok(reportService.getMonthlyReports());
    }
}

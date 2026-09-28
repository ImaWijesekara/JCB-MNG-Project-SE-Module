package com.se.jcb_mng.controllers;

import com.se.jcb_mng.dto.MonthlyReportDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<MonthlyReportDTO>> getMonthlyReports() {
        // Supplying the aggregated data structure expected by the React frontend charts
        List<MonthlyReportDTO> reports = Arrays.asList(
                new MonthlyReportDTO("September 2026", 450000.0, 12, 25000.0),
                new MonthlyReportDTO("August 2026", 380000.0, 9, 15000.0),
                new MonthlyReportDTO("July 2026", 510000.0, 15, 40000.0)
        );
        return ResponseEntity.ok(reports);
    }
}

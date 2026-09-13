package com.se.jcb_mng.controllers;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.se.jcb_mng.entities.MaintenanceLog;
import com.se.jcb_mng.services.MaintenanceService;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {
    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping("/schedule")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> scheduleMaintenance(
            @RequestParam Long machineId,
            @RequestParam String operatorUsername,
            @RequestParam String description,
            @RequestParam String serviceDate) {
        try {
            LocalDate date = LocalDate.parse(serviceDate);
            MaintenanceLog log = maintenanceService.scheduleMaintenance(machineId, operatorUsername, description, date);
            return ResponseEntity.ok(toResponse(log));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MaintenanceResponse>> getAllMaintenance() {
        List<MaintenanceResponse> tasks = maintenanceService.getAllMaintenance().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<List<MaintenanceResponse>> getMyTasks(Authentication authentication) {
        String username = authentication.getName();
        List<MaintenanceResponse> tasks = maintenanceService.getMyTasks(username).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
        public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication) {
        try {
            boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
            MaintenanceLog log = maintenanceService.updateTaskStatus(
                id, status, authentication.getName(), admin);
            return ResponseEntity.ok(toResponse(log));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private MaintenanceResponse toResponse(MaintenanceLog log) {
        return new MaintenanceResponse(
                log.getId(),
                log.getMachine().getModelName() + " (" + log.getMachine().getSerialNumber() + ")",
                log.getOperator().getUsername(),
                log.getDescription(),
                log.getServiceDate(),
                log.getTaskStatus(),
                log.getCost()
        );
    }

    public record MaintenanceResponse(
            Long id,
            String machineDetails,
            String operatorName,
            String description,
            LocalDate serviceDate,
            String status,
            Double cost) {}
}

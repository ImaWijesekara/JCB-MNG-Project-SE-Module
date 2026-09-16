package com.se.jcb_mng.controllers;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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

import com.se.jcb_mng.entities.MaintenanceTask;
import com.se.jcb_mng.services.MaintenanceService;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    public record ScheduleRequest(Long machineId, String operatorUsername, String description, String serviceDate) {}
    public record UpdateRequest(Long machineId, String operatorUsername, String description, String serviceDate, String status) {}

    @PostMapping("/schedule")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> scheduleTask(@RequestBody ScheduleRequest request) {
        try {
            if (request == null || request.serviceDate() == null) {
                throw new IllegalArgumentException("Service date is required");
            }
            LocalDate date = LocalDate.parse(request.serviceDate());
            MaintenanceTask task = maintenanceService.scheduleMaintenance(
                    request.machineId(), request.operatorUsername(), request.description(), date);
            return ResponseEntity.ok(toResponse(task));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(maintenanceService.getAllTasks().stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<List<TaskResponse>> getMyTasks(Authentication auth) {
        return ResponseEntity.ok(maintenanceService.getTasksForOperator(auth.getName()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    @PutMapping("/{taskId}/status")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<?> updateStatus(Authentication auth, @PathVariable Long taskId, @RequestParam String status) {
        try {
            MaintenanceTask task = maintenanceService.updateTaskStatus(taskId, auth.getName(), status);
            return ResponseEntity.ok(toResponse(task));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTask(@PathVariable Long taskId, @RequestBody UpdateRequest request) {
        try {
            if (request == null || request.serviceDate() == null) {
                throw new IllegalArgumentException("Service date is required");
            }
            MaintenanceTask task = maintenanceService.updateMaintenance(
                    taskId,
                    request.machineId(),
                    request.operatorUsername(),
                    request.description(),
                    LocalDate.parse(request.serviceDate()),
                    request.status());
            return ResponseEntity.ok(toResponse(task));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId) {
        try {
            maintenanceService.deleteMaintenance(taskId);
            return ResponseEntity.ok("Maintenance task deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Maps the backend Entity directly to the exact variables your React frontend expects
    private TaskResponse toResponse(MaintenanceTask task) {
        String machineDetails = task.getMachine().getName() + " (" + task.getMachine().getModelYear() + ")";
        return new TaskResponse(
                task.getId(),
                task.getMachine().getId(),
                task.getOperator().getUsername(),
                machineDetails,
                task.getOperator().getUsername(),
                task.getDescription(),
                task.getServiceDate().toString(),
                task.getStatus()
        );
    }

    public record TaskResponse(
            Long id,
            Long machineId,
            String operatorUsername,
            String machineDetails,
            String operatorName,
            String description,
            String serviceDate,
            String status) {}
}
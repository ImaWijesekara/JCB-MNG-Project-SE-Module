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

import com.se.jcb_mng.entities.OperatorTask;
import com.se.jcb_mng.services.OperatorService;

@RestController
@RequestMapping("/api/maintenance")
public class OperatorController {

    private final OperatorService operatorService;

    public OperatorController(OperatorService operatorService) {
        this.operatorService = operatorService;
    }

    public record ScheduleRequest(Long machineId, String operatorUsername, String description, String serviceDate, Double cost) {}
    public record UpdateRequest(Long machineId, String operatorUsername, String description, String serviceDate, String status, Double cost) {}

    @PostMapping("/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER', 'MAINTENANCE_MANAGER', 'OPERATOR')")
    public ResponseEntity<?> scheduleTask(Authentication auth, @RequestBody ScheduleRequest request) {
        try {
            if (request == null || request.serviceDate() == null) {
                throw new IllegalArgumentException("Service date is required");
            }
            LocalDate date = LocalDate.parse(request.serviceDate());
                OperatorTask task = auth.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_OPERATOR".equals(authority.getAuthority()))
                    ? operatorService.scheduleMaintenanceForOperator(
                            request.machineId(), auth.getName(), request.description(), date, request.cost())
                    : operatorService.scheduleMaintenance(
                            request.machineId(), request.operatorUsername(), request.description(), date, request.cost());
            return ResponseEntity.ok(toResponse(task));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER', 'MAINTENANCE_MANAGER')")
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(operatorService.getAllTasks().stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<List<TaskResponse>> getMyTasks(Authentication auth) {
        return ResponseEntity.ok(operatorService.getTasksForOperator(auth.getName()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    @PutMapping("/{taskId}/status")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<?> updateStatus(Authentication auth, @PathVariable Long taskId, @RequestParam String status) {
        try {
            OperatorTask task = operatorService.updateTaskStatus(taskId, auth.getName(), status);
            return ResponseEntity.ok(toResponse(task));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER', 'MAINTENANCE_MANAGER', 'OPERATOR')")
    public ResponseEntity<?> updateTask(Authentication auth, @PathVariable Long taskId, @RequestBody UpdateRequest request) {
        try {
            if (request == null || request.serviceDate() == null) {
                throw new IllegalArgumentException("Service date is required");
            }
            LocalDate serviceDate = LocalDate.parse(request.serviceDate());
                OperatorTask task = auth.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_OPERATOR".equals(authority.getAuthority()))
                ? request.cost() == null
                    ? operatorService.updateOperatorMaintenance(
                            taskId, auth.getName(), request.machineId(), request.description(),
                            serviceDate, request.status())
                    : operatorService.updateOperatorMaintenance(
                            taskId, auth.getName(), request.machineId(), request.description(),
                            serviceDate, request.status(), request.cost())
                : request.cost() == null
                    ? operatorService.updateMaintenance(
                            taskId, request.machineId(), request.operatorUsername(), request.description(),
                            serviceDate, request.status())
                    : operatorService.updateMaintenance(
                            taskId, request.machineId(), request.operatorUsername(), request.description(),
                            serviceDate, request.status(), request.cost());
            return ResponseEntity.ok(toResponse(task));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER', 'MAINTENANCE_MANAGER', 'OPERATOR')")
    public ResponseEntity<?> deleteTask(Authentication auth, @PathVariable Long taskId) {
        try {
            if (auth.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_OPERATOR".equals(authority.getAuthority()))) {
                operatorService.deleteOperatorMaintenance(taskId, auth.getName());
            } else {
                operatorService.deleteMaintenance(taskId);
            }
            return ResponseEntity.ok("Maintenance task deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Maps the backend Entity directly to the exact variables your React frontend expects
    private TaskResponse toResponse(OperatorTask task) {
        String machineDetails = task.getMachine().getName() + " (" + task.getMachine().getModelYear() + ")";
        return new TaskResponse(
                task.getId(),
                task.getMachine().getId(),
                task.getOperator().getUsername(),
                machineDetails,
                task.getOperator().getUsername(),
                task.getDescription(),
                task.getServiceDate().toString(),
                task.getStatus(),
                task.getCost() == null ? 0.0 : task.getCost()
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
            String status,
            Double cost) {}
}
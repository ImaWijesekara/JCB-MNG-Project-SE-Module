package com.se.jcb_mng.controllers;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

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

import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.services.MachineService;

@RestController
@RequestMapping("/api/machines")
public class MachineController {

    private final MachineService machineService;

    public MachineController(MachineService machineService) {
        this.machineService = machineService;
    }

        // CREATE (Admin, Operation Manager, or an operator registering a field machine)
    @PostMapping("/add")
        @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER', 'OPERATOR')")
        public ResponseEntity<?> addMachine(Authentication authentication, @RequestBody Machine machine) {
        try {
            boolean isOperator = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_OPERATOR".equals(authority.getAuthority()));
            Machine createdMachine = isOperator
                ? machineService.addOperatorMachine(authentication.getName(), machine)
                : machineService.addMachine(machine);
            return ResponseEntity.ok(createdMachine);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // READ (Everyone can view all machines)
    @GetMapping("/all")
    public ResponseEntity<List<Machine>> getAllMachines() {
        return ResponseEntity.ok(machineService.getAllMachines());
    }

    // READ (Customers browsing available machines)
    @GetMapping("/available")
    public ResponseEntity<List<Machine>> getAvailableMachines() {
        return ResponseEntity.ok(machineService.getAvailableMachines());
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<List<Machine>> getMyMachines(Authentication authentication) {
        return ResponseEntity.ok(machineService.getMachinesForOperator(authentication.getName()));
    }

    // UPDATE (Admin or Operation Manager)
    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<?> updateMachine(@PathVariable Long id, @RequestBody Machine machine) {
        try {
            return ResponseEntity.ok(machineService.updateMachine(id, machine));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<?> updateMachineStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(machineService.updateMachineStatus(id, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/operator-update")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<?> updateOperatorMachine(Authentication authentication,
                                                   @PathVariable Long id,
                                                   @RequestBody OperatorMachineUpdateRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Machine update details are required");
            }
            LocalDate startDate = parseDate(request.startDate());
            LocalDate endDate = parseDate(request.endDate());
            return ResponseEntity.ok(machineService.updateOperatorMachine(
                    id, authentication.getName(), request.status(), request.operationalStatus(),
                    request.currentLocation(), startDate, endDate));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/operator-delete")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<?> deleteOperatorMachine(Authentication authentication, @PathVariable Long id) {
        try {
            machineService.deleteOperatorMachine(id, authentication.getName());
            return ResponseEntity.ok("Machine removed successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE (Admin only)
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMachine(@PathVariable Long id) {
        try {
            machineService.deleteMachine(id);
            return ResponseEntity.ok("Machine deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private LocalDate parseDate(String date) {
        return date == null || date.isBlank() ? null : LocalDate.parse(date);
    }

    public record OperatorMachineUpdateRequest(String status, String operationalStatus,
                                               String currentLocation, String startDate, String endDate) {}
}
package com.se.jcb_mng.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // CREATE (Admin or Operation Manager)
    @PostMapping("/add")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<?> addMachine(@RequestBody Machine machine) {
        try {
            return ResponseEntity.ok(machineService.addMachine(machine));
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
}
package com.se.jcb_mng.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addMachine(@RequestParam String modelName, @RequestParam String serialNumber) {
        try {
            Machine machine = machineService.addMachine(modelName, serialNumber);
            return ResponseEntity.ok(new MachineResponse(machine.getId(), machine.getModelName(), machine.getSerialNumber(), machine.getOperationalStatus()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<MachineResponse>> getAllMachines() {
        // Available to anyone who is authenticated, so no @PreAuthorize needed
        List<MachineResponse> machines = machineService.getAllMachines().stream()
                .map(m -> new MachineResponse(m.getId(), m.getModelName(), m.getSerialNumber(), m.getOperationalStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(machines);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMachineStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Machine machine = machineService.updateStatus(id, status);
            return ResponseEntity.ok(new MachineResponse(machine.getId(), machine.getModelName(), machine.getSerialNumber(), machine.getOperationalStatus()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record MachineResponse(Long id, String modelName, String serialNumber, String status) {}

}

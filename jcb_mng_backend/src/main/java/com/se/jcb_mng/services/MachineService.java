package com.se.jcb_mng.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.repositories.MachineRepository;

@Service
public class MachineService {

    private final MachineRepository machineRepository;

    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }

    // CREATE
    public Machine addMachine(Machine machine) {
        validateMachine(machine);
        machine.setName(machine.getName().trim());
        machine.setModelName(machine.getModelName().trim());
        machine.setModelYear(machine.getModelYear().trim());
        machine.setSerialNumber(machine.getSerialNumber().trim());
        if (machineRepository.existsBySerialNumber(machine.getSerialNumber())) {
            throw new IllegalArgumentException("Serial number is already registered");
        }
        machine.setStatus(normalizeStatus(machine.getStatus()));
        machine.setOperationalStatus(normalizeOperationalStatus(machine.getOperationalStatus()));
        return machineRepository.save(machine);
    }

    // READ (All)
    public List<Machine> getAllMachines() {
        return machineRepository.findAll();
    }

    // READ (Only Available - for Customers)
    public List<Machine> getAvailableMachines() {
        return machineRepository.findByStatus("AVAILABLE");
    }

    // UPDATE
    public Machine updateMachine(Long id, Machine updatedData) {
        Machine existing = machineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));

        validateMachine(updatedData);
        existing.setName(updatedData.getName().trim());
        existing.setModelName(updatedData.getModelName().trim());
        existing.setModelYear(updatedData.getModelYear().trim());
        existing.setSerialNumber(updatedData.getSerialNumber().trim());
        if (machineRepository.existsBySerialNumberAndIdNot(existing.getSerialNumber(), id)) {
            throw new IllegalArgumentException("Serial number is already registered");
        }
        existing.setDailyRate(updatedData.getDailyRate());
        existing.setStatus(normalizeStatus(updatedData.getStatus()));
        existing.setOperationalStatus(normalizeOperationalStatus(updatedData.getOperationalStatus()));

        return machineRepository.save(existing);
    }

    // DELETE
    public void deleteMachine(Long id) {
        if (!machineRepository.existsById(id)) {
            throw new IllegalArgumentException("Machine not found");
        }
        machineRepository.deleteById(id);
    }

    public Machine updateMachineStatus(Long id, String status) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));
        machine.setStatus(normalizeStatus(status));
        return machineRepository.save(machine);
    }

    private void validateMachine(Machine machine) {
        if (machine == null || machine.getName() == null || machine.getName().isBlank()) {
            throw new IllegalArgumentException("Machine name is required");
        }
        if (machine.getModelName() == null || machine.getModelName().isBlank()) {
            throw new IllegalArgumentException("Model name is required");
        }
        if (machine.getModelYear() == null || machine.getModelYear().isBlank()) {
            throw new IllegalArgumentException("Model year is required");
        }
        if (machine.getSerialNumber() == null || machine.getSerialNumber().isBlank()) {
            throw new IllegalArgumentException("Serial number is required");
        }
        if (machine.getDailyRate() == null || !Double.isFinite(machine.getDailyRate()) || machine.getDailyRate() < 0) {
            throw new IllegalArgumentException("Daily rate must be zero or greater");
        }
        if (!machine.getModelYear().trim().matches("\\d{4}")) {
            throw new IllegalArgumentException("Model year must contain four digits");
        }
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = status == null || status.isBlank() ? "AVAILABLE" : status.trim().toUpperCase();
        if (!List.of("AVAILABLE", "RENTED", "MAINTENANCE").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Status must be AVAILABLE, RENTED, or MAINTENANCE");
        }
        return normalizedStatus;
    }

    private String normalizeOperationalStatus(String operationalStatus) {
        if (operationalStatus == null || operationalStatus.isBlank()) {
            return "OPERATIONAL";
        }
        return operationalStatus.trim().toUpperCase();
    }
}
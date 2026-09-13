package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.entities.MaintenanceLog;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.MachineRepository;
import com.se.jcb_mng.repositories.MaintenanceLogRepository;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class MaintenanceService {
    private final MaintenanceLogRepository maintenanceRepo;
    private final MachineRepository machineRepo;
    private final UserRepository userRepo;

    public MaintenanceService(MaintenanceLogRepository maintenanceRepo, MachineRepository machineRepo, UserRepository userRepo) {
        this.maintenanceRepo = maintenanceRepo;
        this.machineRepo = machineRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public MaintenanceLog scheduleMaintenance(Long machineId, String operatorUsername, String description, LocalDate serviceDate) {
        Machine machine = machineRepo.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));

        if (!"AVAILABLE".equalsIgnoreCase(machine.getOperationalStatus())) {
            throw new IllegalArgumentException("Machine is not available for maintenance");
        }

        User operator = userRepo.findByUsername(operatorUsername)
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));

        if (!"OPERATOR".equalsIgnoreCase(operator.getRole())) {
            throw new IllegalArgumentException("Selected user is not an operator");
        }

        MaintenanceLog log = new MaintenanceLog();
        log.setMachine(machine);
        log.setOperator(operator);
        log.setDescription(description);
        log.setServiceDate(serviceDate);
        log.setTaskStatus("SCHEDULED");

        machine.setOperationalStatus("IN_MAINTENANCE");

        return maintenanceRepo.save(log);
    }

    public List<MaintenanceLog> getAllMaintenance() {
        return maintenanceRepo.findAll();
    }

    public List<MaintenanceLog> getMyTasks(String username) {
        return maintenanceRepo.findByOperatorUsername(username);
    }

    @Transactional
    public MaintenanceLog updateTaskStatus(Long logId, String status, String username, boolean admin) {
        MaintenanceLog log = maintenanceRepo.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        if (!List.of("SCHEDULED", "IN_PROGRESS", "COMPLETED").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid maintenance status");
        }

        if (!admin && !log.getOperator().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can only update your assigned tasks");
        }

        log.setTaskStatus(normalizedStatus);

        if ("COMPLETED".equals(normalizedStatus)) {
            Machine machine = log.getMachine();
            machine.setOperationalStatus("AVAILABLE");
        }

        return maintenanceRepo.save(log);
    }
}

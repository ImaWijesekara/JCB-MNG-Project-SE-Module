package com.se.jcb_mng.services;

import org.springframework.stereotype.Service;
import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.entities.MaintenanceLog;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.MachineRepository;
import com.se.jcb_mng.repositories.MaintenanceLogRepository;
import com.se.jcb_mng.repositories.UserRepository;
import java.time.LocalDate;
import java.util.List;

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

    public MaintenanceLog scheduleMaintenance(Long machineId, String operatorUsername, String description, LocalDate serviceDate) {
        Machine machine = machineRepo.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));

        User operator = userRepo.findByUsername(operatorUsername)
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));

        MaintenanceLog log = new MaintenanceLog();
        log.setMachine(machine);
        log.setOperator(operator);
        log.setDescription(description);
        log.setServiceDate(serviceDate);
        log.setTaskStatus("SCHEDULED");

        // Automatically update the machine status
        machine.setOperationalStatus("IN_MAINTENANCE");
        machineRepo.save(machine);

        return maintenanceRepo.save(log);
    }

    public List<MaintenanceLog> getAllMaintenance() {
        return maintenanceRepo.findAll();
    }

    public List<MaintenanceLog> getMyTasks(String username) {
        return maintenanceRepo.findByOperatorUsername(username);
    }

    public MaintenanceLog updateTaskStatus(Long logId, String status) {
        MaintenanceLog log = maintenanceRepo.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        log.setTaskStatus(status);

        // If completed, make the machine available again
        if ("COMPLETED".equalsIgnoreCase(status)) {
            Machine machine = log.getMachine();
            machine.setOperationalStatus("AVAILABLE");
            machineRepo.save(machine);
        }

        return maintenanceRepo.save(log);
    }
}

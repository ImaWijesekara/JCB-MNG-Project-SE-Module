package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.entities.MaintenanceTask;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.MachineRepository;
import com.se.jcb_mng.repositories.MaintenanceTaskRepository;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class MaintenanceService {

    private final MaintenanceTaskRepository maintenanceRepository;
    private final MachineRepository machineRepository;
    private final UserRepository userRepository;

    public MaintenanceService(MaintenanceTaskRepository maintenanceRepository,
                              MachineRepository machineRepository,
                              UserRepository userRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.machineRepository = machineRepository;
        this.userRepository = userRepository;
    }

    public MaintenanceTask scheduleMaintenance(Long machineId, String operatorUsername, String description, LocalDate serviceDate) {
        if (machineId == null) {
            throw new IllegalArgumentException("Machine is required");
        }
        if (operatorUsername == null || operatorUsername.isBlank()) {
            throw new IllegalArgumentException("Operator is required");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (description.trim().length() > 1000) {
            throw new IllegalArgumentException("Description must not exceed 1000 characters");
        }
        if (serviceDate == null || serviceDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Service date cannot be in the past");
        }

        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));

        User operator = userRepository.findByUsername(operatorUsername.trim())
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));
        if (!"OPERATOR".equalsIgnoreCase(operator.getRole())) {
            throw new IllegalArgumentException("Selected user is not an operator");
        }

        MaintenanceTask task = new MaintenanceTask();
        task.setMachine(machine);
        task.setOperator(operator);
        task.setDescription(description.trim());
        task.setServiceDate(serviceDate);
        task.setStatus("SCHEDULED");

        // Optional: Automatically update the machine's status to MAINTENANCE
        machine.setStatus("MAINTENANCE");
        machine.setOperationalStatus("NON_OPERATIONAL");
        machineRepository.save(machine);

        return maintenanceRepository.save(task);
    }

    public List<MaintenanceTask> getAllTasks() {
        return maintenanceRepository.findAll();
    }

    public List<MaintenanceTask> getTasksForOperator(String username) {
        return maintenanceRepository.findByOperatorUsername(username);
    }

    public MaintenanceTask updateMaintenance(Long taskId, Long machineId, String operatorUsername,
                                              String description, LocalDate serviceDate, String status) {
        validateSchedule(machineId, operatorUsername, description, serviceDate);
        String normalizedStatus = normalizeTaskStatus(status);

        MaintenanceTask task = maintenanceRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));
        User operator = findOperator(operatorUsername);

        task.setMachine(machine);
        task.setOperator(operator);
        task.setDescription(description.trim());
        task.setServiceDate(serviceDate);
        task.setStatus(normalizedStatus);
        updateMachineState(machine, normalizedStatus);

        return maintenanceRepository.save(task);
    }

    public void deleteMaintenance(Long taskId) {
        MaintenanceTask task = maintenanceRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        maintenanceRepository.delete(task);

        Machine machine = task.getMachine();
        machine.setStatus("AVAILABLE");
        machine.setOperationalStatus("OPERATIONAL");
        machineRepository.save(machine);
    }

    public MaintenanceTask updateTaskStatus(Long taskId, String username, String newStatus) {
        if (taskId == null || username == null || username.isBlank()) {
            throw new IllegalArgumentException("Task and operator are required");
        }
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("Task status is required");
        }
        String normalizedStatus = normalizeTaskStatus(newStatus);
        MaintenanceTask task = maintenanceRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (!task.getOperator().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can update only your assigned tasks");
        }

        task.setStatus(normalizedStatus);

        // Optional: If completed, set machine back to AVAILABLE
        if ("COMPLETED".equals(normalizedStatus)) {
            updateMachineState(task.getMachine(), normalizedStatus);
        }

        return maintenanceRepository.save(task);
    }

    private void validateSchedule(Long machineId, String operatorUsername, String description, LocalDate serviceDate) {
        if (machineId == null) {
            throw new IllegalArgumentException("Machine is required");
        }
        if (operatorUsername == null || operatorUsername.isBlank()) {
            throw new IllegalArgumentException("Operator is required");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (description.trim().length() > 1000) {
            throw new IllegalArgumentException("Description must not exceed 1000 characters");
        }
        if (serviceDate == null || serviceDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Service date cannot be in the past");
        }
    }

    private User findOperator(String operatorUsername) {
        User operator = userRepository.findByUsername(operatorUsername.trim())
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));
        if (!"OPERATOR".equalsIgnoreCase(operator.getRole())) {
            throw new IllegalArgumentException("Selected user is not an operator");
        }
        return operator;
    }

    private String normalizeTaskStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Task status is required");
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!List.of("SCHEDULED", "COMPLETED").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Status must be SCHEDULED or COMPLETED");
        }
        return normalizedStatus;
    }

    private void updateMachineState(Machine machine, String taskStatus) {
        if ("COMPLETED".equals(taskStatus)) {
            machine.setStatus("AVAILABLE");
            machine.setOperationalStatus("OPERATIONAL");
        } else {
            machine.setStatus("MAINTENANCE");
            machine.setOperationalStatus("NON_OPERATIONAL");
        }
        machineRepository.save(machine);
    }
}
package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.entities.OperatorTask;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.JobAssignmentRepository;
import com.se.jcb_mng.repositories.MachineRepository;
import com.se.jcb_mng.repositories.OperatorTaskRepository;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class OperatorService {

    private final OperatorTaskRepository operatorTaskRepository;
    private final MachineRepository machineRepository;
    private final UserRepository userRepository;
    private final JobAssignmentRepository jobAssignmentRepository;

    public OperatorService(OperatorTaskRepository operatorTaskRepository,
                              MachineRepository machineRepository,
                              UserRepository userRepository,
                              JobAssignmentRepository jobAssignmentRepository) {
        this.operatorTaskRepository = operatorTaskRepository;
        this.machineRepository = machineRepository;
        this.userRepository = userRepository;
        this.jobAssignmentRepository = jobAssignmentRepository;
    }

    public OperatorTask scheduleMaintenance(Long machineId, String operatorUsername, String description, LocalDate serviceDate) {
        return scheduleMaintenance(machineId, operatorUsername, description, serviceDate, 0.0);
    }

    public OperatorTask scheduleMaintenance(Long machineId, String operatorUsername, String description,
            LocalDate serviceDate, Double cost) {
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
        validateCost(cost);

        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));

        User operator = userRepository.findByUsername(operatorUsername.trim())
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));
        if (!"OPERATOR".equalsIgnoreCase(operator.getRole())) {
            throw new IllegalArgumentException("Selected user is not an operator");
        }

        OperatorTask task = new OperatorTask();
        task.setMachine(machine);
        task.setOperator(operator);
        task.setDescription(description.trim());
        task.setServiceDate(serviceDate);
        task.setStatus("SCHEDULED");
        task.setCost(cost);

        // Optional: Automatically update the machine's status to MAINTENANCE
        machine.setStatus("MAINTENANCE");
        machine.setOperationalStatus("NON_OPERATIONAL");
        machineRepository.save(machine);

        return operatorTaskRepository.save(task);
    }

    public OperatorTask scheduleMaintenanceForOperator(Long machineId, String username,
                                                           String description, LocalDate serviceDate) {
        requireAssignedMachine(machineId, username);
        return scheduleMaintenance(machineId, username, description, serviceDate);
    }

    public OperatorTask scheduleMaintenanceForOperator(Long machineId, String username, String description,
            LocalDate serviceDate, Double cost) {
        requireAssignedMachine(machineId, username);
        return scheduleMaintenance(machineId, username, description, serviceDate, cost);
    }

    public List<OperatorTask> getAllTasks() {
        return operatorTaskRepository.findAll();
    }

    public List<OperatorTask> getTasksForOperator(String username) {
        return operatorTaskRepository.findByOperatorUsername(username);
    }

    public OperatorTask updateMaintenance(Long taskId, Long machineId, String operatorUsername,
                                              String description, LocalDate serviceDate, String status) {
        OperatorTask task = operatorTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        return updateMaintenance(taskId, machineId, operatorUsername, description, serviceDate, status,
                task.getCost() == null ? 0.0 : task.getCost());
    }

    public OperatorTask updateMaintenance(Long taskId, Long machineId, String operatorUsername,
            String description, LocalDate serviceDate, String status, Double cost) {
        OperatorTask task = operatorTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        validateSchedule(machineId, operatorUsername, description, serviceDate);
        if (serviceDate.isBefore(LocalDate.now()) && !serviceDate.equals(task.getServiceDate())) {
            throw new IllegalArgumentException("Service date cannot be changed to a past date");
        }
        validateCost(cost);
        String normalizedStatus = normalizeTaskStatus(status);

        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));
        User operator = findOperator(operatorUsername);

        task.setMachine(machine);
        task.setOperator(operator);
        task.setDescription(description.trim());
        task.setServiceDate(serviceDate);
        task.setStatus(normalizedStatus);
        task.setCost(cost);
        updateMachineState(machine, normalizedStatus);

        return operatorTaskRepository.save(task);
    }

    public OperatorTask updateOperatorMaintenance(Long taskId, String username, Long machineId,
                                                      String description, LocalDate serviceDate, String status) {
        OperatorTask task = findOperatorTask(taskId, username);
        return updateOperatorMaintenance(taskId, username, machineId, description, serviceDate, status,
                task.getCost() == null ? 0.0 : task.getCost());
    }

    public OperatorTask updateOperatorMaintenance(Long taskId, String username, Long machineId,
            String description, LocalDate serviceDate, String status, Double cost) {
        OperatorTask task = findOperatorTask(taskId, username);
        requireAssignedMachine(machineId, username);
        return updateMaintenance(task.getId(), machineId, username, description, serviceDate, status, cost);
    }

    public void deleteMaintenance(Long taskId) {
        OperatorTask task = operatorTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        operatorTaskRepository.delete(task);

        Machine machine = task.getMachine();
        if ("MAINTENANCE".equals(machine.getStatus())
                && operatorTaskRepository.findByMachine_IdAndIdNot(machine.getId(), taskId).isEmpty()) {
            machine.setStatus("AVAILABLE");
            machine.setOperationalStatus("OPERATIONAL");
            machineRepository.save(machine);
        }
    }

    public void deleteOperatorMaintenance(Long taskId, String username) {
        findOperatorTask(taskId, username);
        deleteMaintenance(taskId);
    }

    public OperatorTask updateTaskStatus(Long taskId, String username, String newStatus) {
        if (taskId == null || username == null || username.isBlank()) {
            throw new IllegalArgumentException("Task and operator are required");
        }
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("Task status is required");
        }
        String normalizedStatus = normalizeTaskStatus(newStatus);
        OperatorTask task = operatorTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (!task.getOperator().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can update only your assigned tasks");
        }

        task.setStatus(normalizedStatus);

        // Optional: If completed, set machine back to AVAILABLE
        if ("COMPLETED".equals(normalizedStatus)) {
            updateMachineState(task.getMachine(), normalizedStatus);
        }

        return operatorTaskRepository.save(task);
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
        if (serviceDate == null) {
            throw new IllegalArgumentException("Service date is required");
        }
    }

    private void validateCost(Double cost) {
        if (cost == null || !Double.isFinite(cost) || cost < 0) {
            throw new IllegalArgumentException("Maintenance cost must be a non-negative amount");
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

    private OperatorTask findOperatorTask(Long taskId, String username) {
        if (taskId == null || username == null || username.isBlank()) {
            throw new IllegalArgumentException("Task and operator are required");
        }
        OperatorTask task = operatorTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (!task.getOperator().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can manage only your assigned tasks");
        }
        return task;
    }

    private void requireAssignedMachine(Long machineId, String username) {
        if (machineId == null || username == null || username.isBlank()) {
            throw new IllegalArgumentException("Machine and operator are required");
        }
        boolean assigned = jobAssignmentRepository.findByOperatorUsernameOrderByAssignedDateDesc(username)
                .stream().anyMatch(assignment -> assignment.getBooking().getMachine().getId().equals(machineId))
                || operatorTaskRepository.findByOperatorUsername(username)
                .stream().anyMatch(task -> task.getMachine().getId().equals(machineId));
        if (!assigned) {
            throw new IllegalArgumentException("You can manage maintenance only for machines assigned to you");
        }
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
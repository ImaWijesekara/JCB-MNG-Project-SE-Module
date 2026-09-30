package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.se.jcb_mng.entities.JobAssignment;
import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.entities.OperatorTask;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.JobAssignmentRepository;
import com.se.jcb_mng.repositories.MachineRepository;
import com.se.jcb_mng.repositories.OperatorTaskRepository;

@Service
public class MachineService {

    private final MachineRepository machineRepository;
    private final BookingRepository bookingRepository;
    private final JobAssignmentRepository jobAssignmentRepository;
    private final OperatorTaskRepository operatorTaskRepository;

    public MachineService(MachineRepository machineRepository,
                          BookingRepository bookingRepository,
                          JobAssignmentRepository jobAssignmentRepository,
                          OperatorTaskRepository operatorTaskRepository) {
        this.machineRepository = machineRepository;
        this.bookingRepository = bookingRepository;
        this.jobAssignmentRepository = jobAssignmentRepository;
        this.operatorTaskRepository = operatorTaskRepository;
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

    public Machine addOperatorMachine(String username, Machine machine) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Operator is required");
        }
        if (machine == null) {
            throw new IllegalArgumentException("Machine details are required");
        }
        if (machine.getDailyRate() == null || machine.getDailyRate() <= 0) {
            throw new IllegalArgumentException("Daily rate must be greater than zero");
        }
        if ("RENTED".equalsIgnoreCase(machine.getStatus())) {
            throw new IllegalArgumentException("Rental status is controlled by bookings");
        }
        machine.setCreatedByUsername(username);
        return addMachine(machine);
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
        existing.setCurrentLocation(updatedData.getCurrentLocation());
        existing.setStartDate(updatedData.getStartDate());
        existing.setEndDate(updatedData.getEndDate());

        return machineRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public List<Machine> getMachinesForOperator(String username) {
        Map<Long, Machine> assignedMachines = new LinkedHashMap<>();
        for (JobAssignment assignment : jobAssignmentRepository.findByOperatorUsernameOrderByAssignedDateDesc(username)) {
            Machine machine = assignment.getBooking().getMachine();
            assignedMachines.put(machine.getId(), machine);
        }
        for (OperatorTask task : operatorTaskRepository.findByOperatorUsername(username)) {
            Machine machine = task.getMachine();
            assignedMachines.putIfAbsent(machine.getId(), machine);
        }
        for (Machine machine : machineRepository.findByCreatedByUsername(username)) {
            assignedMachines.putIfAbsent(machine.getId(), machine);
        }
        return List.copyOf(assignedMachines.values());
    }

    @Transactional
    public Machine updateOperatorMachine(Long id, String username, String status, String operationalStatus,
                                         String currentLocation, LocalDate startDate, LocalDate endDate) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));
        boolean assignedToOperator = jobAssignmentRepository.findByOperatorUsernameOrderByAssignedDateDesc(username)
                .stream().anyMatch(assignment -> assignment.getBooking().getMachine().getId().equals(id))
                || operatorTaskRepository.findByOperatorUsername(username)
            .stream().anyMatch(task -> task.getMachine().getId().equals(id))
            || username.equals(machine.getCreatedByUsername());
        if (!assignedToOperator) {
            throw new IllegalArgumentException("You can update only machines assigned to you");
        }
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Return date must be on or after deployment start date");
        }

        String normalizedStatus = normalizeStatus(status);
        if ("RENTED".equals(normalizedStatus) != "RENTED".equals(machine.getStatus())) {
            throw new IllegalArgumentException("Rental status is controlled by bookings");
        }
        String normalizedOperationalStatus = normalizeOperationalStatus(operationalStatus);
        if ("NON_OPERATIONAL".equals(normalizedOperationalStatus) && "AVAILABLE".equals(normalizedStatus)) {
            normalizedStatus = "MAINTENANCE";
        }

        machine.setStatus(normalizedStatus);
        machine.setOperationalStatus(normalizedOperationalStatus);
        machine.setCurrentLocation(currentLocation == null || currentLocation.isBlank() ? null : currentLocation.trim());
        machine.setStartDate(startDate);
        machine.setEndDate(endDate);
        return machineRepository.save(machine);
    }

    // DELETE
    public void deleteMachine(Long id) {
        if (!machineRepository.existsById(id)) {
            throw new IllegalArgumentException("Machine not found");
        }
        machineRepository.deleteById(id);
    }

    @Transactional
    public void deleteOperatorMachine(Long id, String username) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));
        if (username == null || !username.equals(machine.getCreatedByUsername())) {
            throw new IllegalArgumentException("You can delete only machines registered by you");
        }
        if (bookingRepository.existsByMachineId(id) || operatorTaskRepository.existsByMachine_Id(id)) {
            throw new IllegalArgumentException("Machines with booking or task history cannot be deleted");
        }
        machineRepository.delete(machine);
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
        if (machine.getStartDate() != null && machine.getEndDate() != null
                && machine.getEndDate().isBefore(machine.getStartDate())) {
            throw new IllegalArgumentException("Return date must be on or after deployment start date");
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
        String normalizedStatus = operationalStatus == null || operationalStatus.isBlank()
                ? "OPERATIONAL"
                : operationalStatus.trim().toUpperCase();
        if (!List.of("OPERATIONAL", "NON_OPERATIONAL").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Operational status must be OPERATIONAL or NON_OPERATIONAL");
        }
        return normalizedStatus;
    }
}
package com.se.jcb_mng.services;

import org.springframework.stereotype.Service;
import com.se.jcb_mng.entities.Machine;
import com.se.jcb_mng.repositories.MachineRepository;
import java.util.List;

@Service
public class MachineService {
    private final MachineRepository machineRepository;

    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }

    public Machine addMachine(String modelName, String serialNumber) {
        if (machineRepository.existsBySerialNumber(serialNumber)) {
            throw new IllegalArgumentException("Machine with this serial number already exists.");
        }
        Machine machine = new Machine();
        machine.setModelName(modelName);
        machine.setSerialNumber(serialNumber);
        machine.setOperationalStatus("AVAILABLE");
        return machineRepository.save(machine);
    }

    public List<Machine> getAllMachines() {
        return machineRepository.findAll();
    }

    public Machine updateStatus(Long id, String status) {
        Machine machine = machineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Machine not found"));
        machine.setOperationalStatus(status);
        return machineRepository.save(machine);
    }
}

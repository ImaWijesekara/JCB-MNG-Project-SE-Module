package com.se.jcb_mng.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.se.jcb_mng.entities.Machine;

public interface MachineRepository extends JpaRepository<Machine, Long> {
    // Custom query to let customers only see available machines
    List<Machine> findByStatus(String status);

    boolean existsBySerialNumber(String serialNumber);

    boolean existsBySerialNumberAndIdNot(String serialNumber, Long id);
}
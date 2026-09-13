package com.se.jcb_mng.repositories;

import com.se.jcb_mng.entities.Machine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MachineRepository extends JpaRepository<Machine, Long> {
    boolean existsBySerialNumber(String serialNumber);
}

package com.se.jcb_mng.repositories;

import com.se.jcb_mng.entities.MaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    List<MaintenanceLog> findByMachineId(Long machineId);
    List<MaintenanceLog> findByOperatorUsername(String username);
}

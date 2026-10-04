package com.se.jcb_mng.repositories;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.se.jcb_mng.entities.OperatorTask;

public interface OperatorTaskRepository extends JpaRepository<OperatorTask, Long> {
    // Custom query to find tasks assigned to a specific operator
    List<OperatorTask> findByOperatorUsername(String username);
    List<OperatorTask> findByMachine_IdAndIdNot(Long machineId, Long taskId);
    boolean existsByMachine_Id(Long machineId);
    List<OperatorTask> findByStatusAndServiceDateGreaterThanEqualAndServiceDateLessThan(
            String status, LocalDate startDate, LocalDate endDate);
}
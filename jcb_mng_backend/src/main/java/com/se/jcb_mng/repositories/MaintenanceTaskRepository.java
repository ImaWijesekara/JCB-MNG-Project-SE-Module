package com.se.jcb_mng.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.se.jcb_mng.entities.MaintenanceTask;
import java.util.List;

public interface MaintenanceTaskRepository extends JpaRepository<MaintenanceTask, Long> {
    // Custom query to find tasks assigned to a specific operator
    List<MaintenanceTask> findByOperatorUsername(String username);
}
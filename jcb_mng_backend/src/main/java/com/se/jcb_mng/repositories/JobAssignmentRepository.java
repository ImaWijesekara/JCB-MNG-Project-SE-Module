package com.se.jcb_mng.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.se.jcb_mng.entities.JobAssignment;
import java.util.List;

public interface JobAssignmentRepository extends JpaRepository<JobAssignment, Long> {
    // For the Operator's specific dashboard view
    List<JobAssignment> findByOperatorUsernameOrderByAssignedDateDesc(String username);

    // For the Admin's master view
    List<JobAssignment> findAllByOrderByAssignedDateDesc();

    // To prevent double-assigning the same job
    boolean existsByBookingId(Long bookingId);
}
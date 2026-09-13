package com.se.jcb_mng.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.se.jcb_mng.entities.Feedback;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // Auto-generates SQL to get all feedback from a specific user
    List<Feedback> findByUserId(Long userId);

    List<Feedback> findByUserUsername(String username);


}

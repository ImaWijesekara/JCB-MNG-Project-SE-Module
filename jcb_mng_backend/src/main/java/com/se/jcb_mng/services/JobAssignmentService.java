package com.se.jcb_mng.services;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.JobAssignment;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.JobAssignmentRepository;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class JobAssignmentService {

    private final JobAssignmentRepository jobRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public JobAssignmentService(JobAssignmentRepository jobRepository, BookingRepository bookingRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    // CREATE
    public JobAssignment assignJob(Long bookingId, String operatorUsername) {
        if (bookingId == null || operatorUsername == null || operatorUsername.isBlank()) {
            throw new IllegalArgumentException("Booking and operator are required");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!"APPROVED".equals(booking.getStatus())) {
            throw new IllegalArgumentException("You can only assign operators to APPROVED bookings");
        }
        if (jobRepository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException("An operator is already assigned to this booking");
        }

        User operator = userRepository.findByUsername(operatorUsername.trim())
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));

        if (!"OPERATOR".equalsIgnoreCase(operator.getRole())) {
            throw new IllegalArgumentException("Selected user is not an OPERATOR");
        }

        JobAssignment job = new JobAssignment();
        job.setBooking(booking);
        job.setOperator(operator);
        job.setStatus("ASSIGNED");

        return jobRepository.save(job);
    }

    // READ (All for Admin)
    public List<JobAssignment> getAllAssignments() {
        return jobRepository.findAllByOrderByAssignedDateDesc();
    }

    // READ (Only for the logged-in Operator)
    public List<JobAssignment> getMyJobs(String username) {
        return jobRepository.findByOperatorUsernameOrderByAssignedDateDesc(username);
    }

    // UPDATE
    public JobAssignment updateJobStatus(Long jobId, String username, String role, String status) {
        if (jobId == null || status == null || status.isBlank()) {
            throw new IllegalArgumentException("Job and status are required");
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!Set.of("ASSIGNED", "IN_PROGRESS", "COMPLETED").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid job status");
        }
        JobAssignment job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job Assignment not found"));

        if ("OPERATOR".equals(role)) {
            if (!job.getOperator().getUsername().equals(username)) {
                throw new IllegalArgumentException("You can update only your assigned jobs");
            }
            if (!Set.of("IN_PROGRESS", "COMPLETED").contains(normalizedStatus)) {
                throw new IllegalArgumentException("Operators can only start or complete jobs");
            }
        } else if (!"ADMIN".equals(role)) {
            throw new IllegalArgumentException("You are not allowed to update jobs");
        }

        job.setStatus(normalizedStatus);
        return jobRepository.save(job);
    }

    // DELETE (Admin only)
    public void deleteAssignment(Long id) {
        if (!jobRepository.existsById(id)) {
            throw new IllegalArgumentException("Job Assignment not found");
        }
        jobRepository.deleteById(id);
    }
}
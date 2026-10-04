package com.se.jcb_mng.services;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
        return assignJob(bookingId, operatorUsername, null, null, "Operator assignment", "MEDIUM", null);
    }

    public JobAssignment assignJob(Long bookingId, String operatorUsername, LocalDate assignedDate, String status,
            String description, String priority, String notes) {
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

        JobAssignment job = new JobAssignment();
        job.setBooking(booking);
        job.setOperator(findOperator(operatorUsername));
        job.setAssignedDate(assignedDate == null ? LocalDate.now() : assignedDate);
        job.setStatus(normalizeStatus(status == null ? "ASSIGNED" : status));
        job.setDescription(normalizeDescription(description));
        job.setPriority(normalizePriority(priority));
        job.setNotes(normalizeNotes(notes));

        return jobRepository.save(job);
    }

    // READ (All for Admin)
    public List<JobAssignment> getAllAssignments() {
        return jobRepository.findAllByOrderByAssignedDateDesc();
    }

    public List<Booking> getAvailableBookings() {
        return bookingRepository.findByStatusOrderByCreatedAtDesc("APPROVED").stream()
                .filter(booking -> !jobRepository.existsByBookingId(booking.getId()))
                .collect(Collectors.toList());
    }

    // READ (Only for the logged-in Operator)
    public List<JobAssignment> getMyJobs(String username) {
        return jobRepository.findByOperatorUsernameOrderByAssignedDateDesc(username);
    }

    // UPDATE
    public JobAssignment updateAssignment(Long jobId, Long bookingId, String operatorUsername,
            LocalDate assignedDate, String status, String description, String priority, String notes) {
        if (jobId == null || bookingId == null || operatorUsername == null || operatorUsername.isBlank()) {
            throw new IllegalArgumentException("Job, booking, and operator are required");
        }

        JobAssignment job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job Assignment not found"));
        Booking booking = job.getBooking();
        if (!booking.getId().equals(bookingId)) {
            booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
            if (!"APPROVED".equals(booking.getStatus())) {
                throw new IllegalArgumentException("You can only assign operators to APPROVED bookings");
            }
            if (jobRepository.existsByBookingId(bookingId)) {
                throw new IllegalArgumentException("An operator is already assigned to this booking");
            }
        }

        job.setBooking(booking);
        job.setOperator(findOperator(operatorUsername));
        if (assignedDate != null) {
            job.setAssignedDate(assignedDate);
        }
        if (status != null) {
            job.setStatus(normalizeStatus(status));
        }
        job.setDescription(normalizeDescription(description));
        job.setPriority(normalizePriority(priority));
        job.setNotes(normalizeNotes(notes));
        return jobRepository.save(job);
    }

    public JobAssignment updateJobStatus(Long jobId, String username, String role, String status) {
        if (jobId == null || status == null || status.isBlank()) {
            throw new IllegalArgumentException("Job and status are required");
        }
        String normalizedStatus = normalizeStatus(status);
        JobAssignment job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job Assignment not found"));

        if ("OPERATOR".equals(role)) {
            if (!job.getOperator().getUsername().equals(username)) {
                throw new IllegalArgumentException("You can update only your assigned jobs");
            }
            if (!Set.of("IN_PROGRESS", "COMPLETED").contains(normalizedStatus)) {
                throw new IllegalArgumentException("Operators can only start or complete jobs");
            }
        } else if (!Set.of("ADMIN", "OPERATION_MANAGER", "DISPATCH_MANAGER").contains(role)) {
            throw new IllegalArgumentException("You are not allowed to update jobs");
        }

        job.setStatus(normalizedStatus);
        return jobRepository.save(job);
    }

    private User findOperator(String operatorUsername) {
        User operator = userRepository.findByUsername(operatorUsername.trim())
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));
        if (!"OPERATOR".equalsIgnoreCase(operator.getRole())) {
            throw new IllegalArgumentException("Selected user is not an OPERATOR");
        }
        return operator;
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = status.trim().toUpperCase();
        if (!Set.of("ASSIGNED", "IN_PROGRESS", "COMPLETED").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid job status");
        }
        return normalizedStatus;
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Job description is required");
        }
        String normalizedDescription = description.trim();
        if (normalizedDescription.length() > 1000) {
            throw new IllegalArgumentException("Job description must be 1000 characters or fewer");
        }
        return normalizedDescription;
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            throw new IllegalArgumentException("Job priority is required");
        }
        String normalizedPriority = priority.trim().toUpperCase();
        if (!Set.of("LOW", "MEDIUM", "HIGH").contains(normalizedPriority)) {
            throw new IllegalArgumentException("Priority must be LOW, MEDIUM, or HIGH");
        }
        return normalizedPriority;
    }

    private String normalizeNotes(String notes) {
        if (notes != null && notes.length() > 2000) {
            throw new IllegalArgumentException("Notes must be 2000 characters or fewer");
        }
        return notes == null || notes.isBlank() ? null : notes.trim();
    }

    // DELETE (Admin/operation/dispatch manager)
    public void deleteAssignment(Long id) {
        if (!jobRepository.existsById(id)) {
            throw new IllegalArgumentException("Job Assignment not found");
        }
        jobRepository.deleteById(id);
    }
}
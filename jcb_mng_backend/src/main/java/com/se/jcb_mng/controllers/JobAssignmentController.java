package com.se.jcb_mng.controllers;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.se.jcb_mng.entities.JobAssignment;
import com.se.jcb_mng.services.JobAssignmentService;

@RestController
@RequestMapping("/api/jobs")
public class JobAssignmentController {

    private final JobAssignmentService jobService;

    public JobAssignmentController(JobAssignmentService jobService) {
        this.jobService = jobService;
    }

    public record AssignmentRequest(
            Long bookingId,
            String operatorUsername,
            String assignedDate,
            String status,
            String description,
            String priority,
            String notes) {}

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<?> assignJob(@RequestBody AssignmentRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Assignment details are required");
            }
            JobAssignment job = jobService.assignJob(
                    request.bookingId(),
                    request.operatorUsername(),
                    parseDate(request.assignedDate()),
                    request.status(),
                    request.description(),
                    request.priority(),
                    request.notes());
            return ResponseEntity.ok(toResponse(job));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @RequestBody AssignmentRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Assignment details are required");
            }
            JobAssignment job = jobService.updateAssignment(
                    id,
                    request.bookingId(),
                    request.operatorUsername(),
                    parseDate(request.assignedDate()),
                    request.status(),
                    request.description(),
                    request.priority(),
                    request.notes());
            return ResponseEntity.ok(toResponse(job));
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllAssignments().stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/available-bookings")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<List<BookingOption>> getAvailableBookings() {
        return ResponseEntity.ok(jobService.getAvailableBookings().stream()
                .map(booking -> new BookingOption(
                        booking.getId(),
                        booking.getMachine().getName() + " (" + booking.getMachine().getModelName() + ")",
                        booking.getStartDate().toString(),
                        booking.getEndDate().toString()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<List<JobResponse>> getMyJobs(Authentication auth) {
        return ResponseEntity.ok(jobService.getMyJobs(auth.getName()).stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER', 'OPERATOR')")
        public ResponseEntity<?> updateStatus(Authentication auth, @PathVariable Long id, @RequestParam String status) {
        try {
            String role = auth.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("");
            JobAssignment job = jobService.updateJobStatus(id, auth.getName(), role, status);
            return ResponseEntity.ok(toResponse(job));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER')")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            jobService.deleteAssignment(id);
            return ResponseEntity.ok("Assignment deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private JobResponse toResponse(JobAssignment job) {
        return new JobResponse(
                job.getId(),
                job.getBooking().getId(),
                job.getBooking().getMachine().getName() + " (" + job.getBooking().getMachine().getModelName() + ")",
                job.getBooking().getUser().getFullName() != null
                    ? job.getBooking().getUser().getFullName()
                    : job.getBooking().getUser().getUsername(),
                job.getBooking().getStartDate() + " to " + job.getBooking().getEndDate(),
                job.getOperator().getUsername(),
                job.getStatus(),
                job.getAssignedDate().toString(),
                job.getDescription(),
                job.getPriority(),
                job.getNotes()
        );
    }

    private LocalDate parseDate(String assignedDate) {
        return assignedDate == null || assignedDate.isBlank() ? null : LocalDate.parse(assignedDate);
    }

    public record JobResponse(
            Long id,
            Long bookingId,
            String machineDetails,
            String customerName,
            String dates,
            String operatorName,
            String status,
            String assignedDate,
            String description,
            String priority,
            String notes) {}

    public record BookingOption(Long id, String machineDetails, String startDate, String endDate) {}

}
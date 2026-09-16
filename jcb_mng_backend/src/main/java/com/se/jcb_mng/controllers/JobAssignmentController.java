package com.se.jcb_mng.controllers;

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

    public record AssignRequest(Long bookingId, String operatorUsername) {}

    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignJob(@RequestBody AssignRequest request) {
        try {
            JobAssignment job = jobService.assignJob(request.bookingId(), request.operatorUsername());
            return ResponseEntity.ok(toResponse(job));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllAssignments().stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<List<JobResponse>> getMyJobs(Authentication auth) {
        return ResponseEntity.ok(jobService.getMyJobs(auth.getName()).stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
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
    @PreAuthorize("hasRole('ADMIN')")
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
                job.getStatus()
        );
    }

    public record JobResponse(Long id, Long bookingId, String machineDetails, String customerName, String dates, String operatorName, String status) {}
}
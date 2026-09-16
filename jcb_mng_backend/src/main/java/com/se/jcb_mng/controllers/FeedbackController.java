package com.se.jcb_mng.controllers;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.se.jcb_mng.entities.Feedback;
import com.se.jcb_mng.services.FeedbackService;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> submitFeedback(
            Authentication authentication,
            @RequestParam String message,
            @RequestParam Integer rating) {
        try {
            Feedback feedback = feedbackService.submitFeedback(authentication.getName(), message, rating);
            return ResponseEntity.ok(toResponse(feedback));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<FeedbackResponse> getAllFeedback() {
        return feedbackService.getAllFeedback().stream()
                .map(FeedbackController::toResponse)
                .toList();
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<FeedbackResponse> getMyFeedback(Authentication authentication) {
        return feedbackService.getFeedbackByUsername(authentication.getName()).stream()
                .map(FeedbackController::toResponse)
                .toList();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> updateFeedback(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam String message,
            @RequestParam Integer rating) {
        try {
            Feedback feedback = feedbackService.updateFeedback(
                    id, authentication.getName(), message, rating);
            return ResponseEntity.ok(toResponse(feedback));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long id) {
        try {
            feedbackService.deleteFeedback(id);
            return ResponseEntity.ok("Feedback deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private static FeedbackResponse toResponse(Feedback feedback) {
        return new FeedbackResponse(
                feedback.getId(),
                feedback.getUser().getUsername(),
                feedback.getMessage(),
                feedback.getRating(),
                feedback.getSubmittedAt());
    }

    public record FeedbackResponse(
            Long id,
            String username,
            String message,
            Integer rating,
            LocalDateTime submittedAt) {
    }
}
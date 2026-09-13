package com.se.jcb_mng.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<FeedbackResponse>> getMyFeedback(Authentication authentication) {
        return ResponseEntity.ok(feedbackService.getFeedbackByUsername(authentication.getName()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')") // Only Admins can see all feedback
    public ResponseEntity<List<FeedbackResponse>> getAllFeedback() {
        return ResponseEntity.ok(feedbackService.getAllFeedback().stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackResponse>> getFeedbackByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        return new FeedbackResponse(
                feedback.getId(),
                feedback.getMessage(),
                feedback.getRating(),
                feedback.getSubmittedAt(),
                feedback.getUser().getUsername());
    }

    public record FeedbackResponse(
            Long id,
            String message,
            Integer rating,
            java.time.LocalDateTime submittedAt,
            String username) {
    }

}

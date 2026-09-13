package com.se.jcb_mng.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Feedback;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.FeedbackRepository;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    public FeedbackService(FeedbackRepository feedbackRepository, UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
    }

    public Feedback submitFeedback(String username, String message, Integer rating) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Feedback feedback = new Feedback();
        feedback.setUser(user);
        feedback.setMessage(message);
        feedback.setRating(rating);

        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public List<Feedback> getFeedbackByUserId(Long userId) {
        return feedbackRepository.findByUserId(userId);
    }

    public List<Feedback> getFeedbackByUsername(String username) {
        return feedbackRepository.findByUserUsername(username);
    }
}

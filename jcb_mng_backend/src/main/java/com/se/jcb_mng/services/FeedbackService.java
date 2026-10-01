package com.se.jcb_mng.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.Booking;
import com.se.jcb_mng.entities.Feedback;
import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.BookingRepository;
import com.se.jcb_mng.repositories.FeedbackRepository;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public FeedbackService(
            FeedbackRepository feedbackRepository,
            UserRepository userRepository,
            BookingRepository bookingRepository) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    public Feedback submitFeedback(String username, Long bookingId, String message, Integer rating) {
        validateFeedback(username, message, rating);
        if (bookingId == null) {
            throw new IllegalArgumentException("A booking is required");
        }
        String normalizedMessage = message.trim();

        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getUser().getUsername().equals(username.trim())) {
            throw new IllegalArgumentException("You can review only your own bookings");
        }
        if (feedbackRepository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException("This booking already has a review");
        }

        Feedback feedback = new Feedback();
        feedback.setUser(user);
        feedback.setBooking(booking);
        feedback.setMessage(normalizedMessage);
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

    public Feedback updateFeedback(Long id, String username, String message, Integer rating) {
        validateFeedback(username, message, rating);

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        if (!feedback.getUser().getUsername().equals(username.trim())) {
            throw new IllegalArgumentException("You can update only your own feedback");
        }

        feedback.setMessage(message.trim());
        feedback.setRating(rating);
        return feedbackRepository.save(feedback);
    }

    // ADDED: Allows Admins to delete inappropriate reviews
    public void deleteFeedback(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Feedback ID is required");
        }
        if (!feedbackRepository.existsById(id)) {
            throw new IllegalArgumentException("Feedback not found");
        }
        feedbackRepository.deleteById(id);
    }

    private void validateFeedback(String username, String message, Integer rating) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Authenticated user is required");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message is required");
        }
        if (message.trim().length() > 1000) {
            throw new IllegalArgumentException("Message must not exceed 1000 characters");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
    }
}
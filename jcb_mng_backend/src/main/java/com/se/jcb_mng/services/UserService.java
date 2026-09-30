package com.se.jcb_mng.services;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // CREATE / REGISTER
    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username is already taken.");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email is already registered.");
        }

        // Encrypt password before saving
        if (user.getPasswordHash() != null && !user.getPasswordHash().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        }

        // Standardize Role (Default to CUSTOMER, remove "ROLE_" prefix if present)
        String role = user.getRole();
        if (role == null || role.isBlank()) {
            role = "CUSTOMER";
        }
        role = role.trim().toUpperCase();
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }
        user.setRole(role);

        return userRepository.save(user);
    }

    // READ (All)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // READ (Single by ID)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // READ (Single by Username for Login/Security)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // UPDATE
    public User updateUser(Long id, User updatedData) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check if email is being changed to one that already exists
        if (!existingUser.getEmail().equalsIgnoreCase(updatedData.getEmail()) &&
                userRepository.existsByEmail(updatedData.getEmail())) {
            throw new IllegalArgumentException("Email is already used by another user.");
        }

        // Update fields
        existingUser.setEmail(updatedData.getEmail());
        existingUser.setFullName(updatedData.getFullName());
        existingUser.setPhoneNumber(updatedData.getPhoneNumber());
        existingUser.setAddress(updatedData.getAddress());

        // Update Role
        String role = updatedData.getRole();
        if (role != null && !role.isBlank()) {
            role = role.trim().toUpperCase();
            if (role.startsWith("ROLE_")) {
                role = role.substring(5);
            }
            existingUser.setRole(role);
        }

        // Only update password if a new one was actually typed in
        if (updatedData.getPasswordHash() != null && !updatedData.getPasswordHash().isBlank()) {
            existingUser.setPasswordHash(passwordEncoder.encode(updatedData.getPasswordHash()));
        }

        return userRepository.save(existingUser);
    }

    // DELETE
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found.");
        }
        userRepository.deleteById(id);
    }
}
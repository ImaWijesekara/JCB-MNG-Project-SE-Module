package com.se.jcb_mng.services;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.repositories.UserRepository;

@Service
public class UserService {

    private static final Set<String> SUPPORTED_ROLES = Set.of(
            "ADMIN", "CUSTOMER", "OPERATOR", "OPERATION_MANAGER", "MAINTENANCE_MANAGER", "FINANCE_OFFICER");

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
        user.setRole(normalizeRole(user.getRole() == null || user.getRole().isBlank()
                ? "CUSTOMER"
                : user.getRole()));

        return userRepository.save(user);
    }

    // READ (All)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getOperators() {
        return userRepository.findByRoleOrderByUsernameAsc("OPERATOR");
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
            existingUser.setRole(normalizeRole(role));
        }

        // Only update password if a new one was actually typed in
        if (updatedData.getPasswordHash() != null && !updatedData.getPasswordHash().isBlank()) {
            existingUser.setPasswordHash(passwordEncoder.encode(updatedData.getPasswordHash()));
        }

        return userRepository.save(existingUser);
    }

    private String normalizeRole(String role) {
        String normalizedRole = role.trim().toUpperCase();
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }
        if (!SUPPORTED_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException("Unsupported user role");
        }
        return normalizedRole;
    }

    // DELETE
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found.");
        }
        userRepository.deleteById(id);
    }
}
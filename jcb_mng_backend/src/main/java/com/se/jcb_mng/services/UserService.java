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


    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Encrypt the password before saving
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

        String role = user.getRole();
        if (role == null || role.isBlank()) {
            role = "CUSTOMER";
        }
        role = role.trim().toUpperCase();
        if (role.startsWith("ROLE_")) {
            role = role.substring("ROLE_".length());
        }
        user.setRole(role);

        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean isAdmin(String username) {
        return findByUsername(username)
                .map(User::getRole)
                .map(role -> role != null ? role.trim().toUpperCase() : "")
                .map(role -> role.startsWith("ROLE_") ? role.substring("ROLE_".length()) : role)
                .map("ADMIN"::equals)
                .orElse(false);
    }


    public User updateProfile(Long userId, String fullName, String phoneNumber, String address) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        existingUser.setFullName(fullName);
        existingUser.setPhoneNumber(phoneNumber);
        existingUser.setAddress(address);

        return userRepository.save(existingUser);
    }


    // CREATE
    public User createUser(User user) {
        // We can just reuse the robust registerUser logic for Admin creation
        return registerUser(user);
    }

    // READ (All)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // READ (Single)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // UPDATE (Admin updating someone else's role, email, etc.)
    public User updateUser(Long id, User updatedData) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Make sure the admin isn't assigning an email that belongs to someone else
        if (!existingUser.getEmail().equals(updatedData.getEmail()) && userRepository.existsByEmail(updatedData.getEmail())) {
            throw new IllegalArgumentException("Email is already registered by another user.");
        }

        // Update fields
        existingUser.setEmail(updatedData.getEmail());
        existingUser.setFullName(updatedData.getFullName());
        existingUser.setPhoneNumber(updatedData.getPhoneNumber());
        existingUser.setAddress(updatedData.getAddress());

        // Format and update Role
        String role = updatedData.getRole();
        if (role != null && !role.isBlank()) {
            role = role.trim().toUpperCase();
            if (role.startsWith("ROLE_")) {
                role = role.substring("ROLE_".length());
            }
            existingUser.setRole(role);
        }

        // Only update password if the admin typed a new one
        if (updatedData.getPasswordHash() != null && !updatedData.getPasswordHash().isEmpty()) {
            existingUser.setPasswordHash(passwordEncoder.encode(updatedData.getPasswordHash()));
        }

        return userRepository.save(existingUser);
    }

    // DELETE
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        userRepository.deleteById(id);
    }
}
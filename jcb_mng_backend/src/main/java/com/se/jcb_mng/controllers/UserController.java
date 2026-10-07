package com.se.jcb_mng.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.se.jcb_mng.entities.User;
import com.se.jcb_mng.services.UserService;
import com.se.jcb_mng.util.JwtUtil;

import lombok.Getter;
import lombok.Setter;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public UserController(UserService userService, AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    // 1. PUBLIC REGISTRATION
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRequest request) {
        try {
            User registeredUser = userService.registerUser(request.toEntity());
            return ResponseEntity.ok(registeredUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. PUBLIC LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String role = authentication.getAuthorities().iterator().next().getAuthority();
            String jwt = jwtUtil.generateToken(loginRequest.getUsername(), role);

            return ResponseEntity.ok(new AuthResponse(jwt));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid username or password. Please try again.");
        }
    }

    // 3. GET ALL USERS (Admin Only)
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers().stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getPhoneNumber(),
                        user.getAddress(),
                        user.getRole(),
                        user.getCreatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @GetMapping("/operators")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATION_MANAGER', 'MAINTENANCE_MANAGER')")
    public ResponseEntity<List<OperatorResponse>> getOperators() {
        List<OperatorResponse> operators = userService.getOperators().stream()
                .map(operator -> new OperatorResponse(operator.getId(), operator.getUsername()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(operators);
    }

    // 4. CREATE USER FROM DASHBOARD (Admin Only)
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
        try {
            User createdUser = userService.registerUser(request.toEntity());
            return ResponseEntity.ok(createdUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. UPDATE FULL USER PROFILE (Admin Only)
    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserRequest request) {
        try {
            User updatedUser = userService.updateUser(id, request.toEntity());
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 6. DELETE USER (Admin Only)
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().body("User completely removed from the system.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==========================================
    // DTOs (Data Transfer Objects)
    // ==========================================

    @Getter
    @Setter
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Getter
    @Setter
    public static class AuthResponse {
        private String token;
        public AuthResponse(String token) {
            this.token = token;
        }
    }

    // Request DTO ensures React fields map perfectly to the Entity
    @Getter
    @Setter
    public static class UserRequest {
        private String username;
        private String email;
        private String fullName;
        private String phoneNumber;
        private String address;
        private String password;       // Sent by Admin Dashboard
        private String passwordHash;   // Sent by Public Register Page
        private String role;

        public User toEntity() {
            User u = new User();
            u.setUsername(username);
            u.setEmail(email);
            u.setFullName(fullName);
            u.setPhoneNumber(phoneNumber);
            u.setAddress(address);
            u.setRole(role);
            
            // Smart Password Mapping
            if (password != null && !password.isEmpty()) {
                u.setPasswordHash(password);
            } else {
                u.setPasswordHash(passwordHash);
            }
            return u;
        }
    }

    // Response Record formats exactly what React needs for the Data Table
    public record UserResponse(
        Long id, 
        String username, 
        String email, 
        String fullName, 
        String phoneNumber, 
        String address, 
        String role, 
        LocalDateTime createdAt
    ) {}

    public record OperatorResponse(Long id, String username) {}
}
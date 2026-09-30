package com.se.jcb_mng.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.se.jcb_mng.entities.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA automatically generates the SQL to find a user by username
    Optional<User> findByUsername(String username);

    // Auto-generates SQL to find a user by email
    Optional<User> findByEmail(String email);

    // Used in UserService validation to prevent duplicate accounts
    boolean existsByUsername(String username);
    
    // Used in UserService validation to prevent duplicate emails
    boolean existsByEmail(String email);
}
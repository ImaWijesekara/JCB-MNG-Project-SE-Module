package com.se.jcb_mng.entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "job_assignments")
public class JobAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One booking can only have one operator assigned to it
    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "operator_id", nullable = false)
    private User operator;

    @Column(nullable = false)
    private String status = "ASSIGNED"; // ASSIGNED, IN_PROGRESS, COMPLETED

    private LocalDate assignedDate = LocalDate.now();

    public JobAssignment() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public User getOperator() { return operator; }
    public void setOperator(User operator) { this.operator = operator; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDate assignedDate) { this.assignedDate = assignedDate; }
}
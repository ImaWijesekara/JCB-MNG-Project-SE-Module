package com.se.jcb_mng.entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "maintenance_tasks")
public class MaintenanceTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne
    @JoinColumn(name = "operator_id", nullable = false)
    private User operator;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private LocalDate serviceDate;

    @Column(nullable = false)
    private String status = "SCHEDULED"; // SCHEDULED, COMPLETED

    public MaintenanceTask() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Machine getMachine() { return machine; }
    public void setMachine(Machine machine) { this.machine = machine; }

    public User getOperator() { return operator; }
    public void setOperator(User operator) { this.operator = operator; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDate serviceDate) { this.serviceDate = serviceDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
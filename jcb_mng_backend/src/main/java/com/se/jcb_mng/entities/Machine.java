package com.se.jcb_mng.entities;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "machines")
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String modelName;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    // e.g., AVAILABLE, IN_USE, IN_MAINTENANCE
    @Column(nullable = false)
    private String operationalStatus = "AVAILABLE";

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }
}

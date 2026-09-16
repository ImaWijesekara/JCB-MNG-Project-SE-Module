package com.se.jcb_mng.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "machines")
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;        // e.g., "JCB 3CX Backhoe Loader"
    
    @Column(nullable = false)
    private String modelName;   // e.g., "3CX"
    
    private String modelYear;   // e.g., "2022"
    
    private Double dailyRate;   // e.g., 15000.00
    
    private String status;      // AVAILABLE, RENTED, MAINTENANCE
    
    @Column(nullable = false)
    private String operationalStatus; // OPERATIONAL, NON_OPERATIONAL

    @Column(nullable = false, unique = true)
    private String serialNumber; // <-- ADDED THIS FIELD (Required & Unique)

    public Machine() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getModelYear() { return modelYear; }
    public void setModelYear(String modelYear) { this.modelYear = modelYear; }

    public Double getDailyRate() { return dailyRate; }
    public void setDailyRate(Double dailyRate) { this.dailyRate = dailyRate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
}
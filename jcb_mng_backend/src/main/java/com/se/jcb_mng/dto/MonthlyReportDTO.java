package com.se.jcb_mng.dto;

public class MonthlyReportDTO {
    private String month;
    private Double revenue;
    private Integer rentals;
    private Double maintenanceCosts;

    public MonthlyReportDTO(String month, Double revenue, Integer rentals, Double maintenanceCosts) {
        this.month = month;
        this.revenue = revenue;
        this.rentals = rentals;
        this.maintenanceCosts = maintenanceCosts;
    }

    // Getters
    public String getMonth() { return month; }
    public Double getRevenue() { return revenue; }
    public Integer getRentals() { return rentals; }
    public Double getMaintenanceCosts() { return maintenanceCosts; }
}

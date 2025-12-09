package com.iot.smartparking.parking_be.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MonthlyRevenueDTO {
    private int month;
    private int year;
    private Double totalRevenue;
}

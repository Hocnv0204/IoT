package com.iot.smartparking.parking_be.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StatisticsResponse {
    // Tong so luot xe dang ky
    private long totalVehicleRegistered ;
    // Tong so xe vao
    private long totalCheckInsToday ;
    // Tong so xe ra
    private long totalCheckOutsToday;
    // So xe hien tai
    private long currentOccupancy ;
}

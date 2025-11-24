package com.iot.smartparking.parking_be.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVehicleRequest {
    private Integer customerId;
    private String licensePlate;
    private String type; // CAR hoặc MOTORBIKE
    private String brand;
    private String color;
}


package com.iot.smartparking.parking_be.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class VehicleDTO {
    private int id ;
    private String licensePlate ;
    private String owner ;
    private String vehicleType ;
}

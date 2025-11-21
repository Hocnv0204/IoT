package com.iot.smartparking.parking_be.dto.request.admin;

import lombok.Data;

@Data
public class UpdateVehicle {
    private String licensePlate ;
    private String type ;
    private String ownerName ;
    private String status ;
}

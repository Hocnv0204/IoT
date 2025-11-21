package com.iot.smartparking.parking_be.dto.request.admin;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class RegisterVehicle {
    private String licensePlate ;
    private String rfidUid ;
    private String ownerName ;
    private String vehicleType ;
}

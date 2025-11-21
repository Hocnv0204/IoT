package com.iot.smartparking.parking_be.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ParkingSessionDTO {
    private String licensePlate ;
    private String ownerName ;
    private String imageOutUrl ;
    private String imageInUrl ;
    private String status ;
    private LocalDateTime timeIn ;
    private LocalDateTime timeOut ;

}

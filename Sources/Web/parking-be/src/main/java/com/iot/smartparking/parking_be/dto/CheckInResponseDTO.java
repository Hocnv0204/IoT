package com.iot.smartparking.parking_be.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CheckInResponseDTO {
    private String status ;
    private String licensePlate ;
    private String ownerName ;
    private LocalDateTime checkInAt ;
}

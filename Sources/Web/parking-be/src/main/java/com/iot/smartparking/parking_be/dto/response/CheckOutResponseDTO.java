package com.iot.smartparking.parking_be.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
@Data
@Builder
public class CheckOutResponseDTO {
    private String status ;
    private String licensePlate ;
    private String ownerName ;
    private LocalDateTime checkOutAt ;
    private LocalDateTime checkInAt ;
    private String imageUrl ;
    private String checkInImageUrl;
    private String cardType ;
    private Double feeCalculated;
    private String registeredLicensePlate;
}

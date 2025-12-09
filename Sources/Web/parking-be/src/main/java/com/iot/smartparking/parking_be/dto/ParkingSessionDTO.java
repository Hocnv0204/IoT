package com.iot.smartparking.parking_be.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ParkingSessionDTO {
    private String licensePlate ;
    private String ownerName ;
    private String checkInImageUrl; // Mapped from imageIn
    private String imageUrl; // Mapped from imageOut
    private String cardCode;
    private String cardType;
    private Double feeCalculated;
    
    private String imageOutUrl ; // Deprecated or keep for compatibility if needed, but removing to force usage of new keys if safe. Keeping for now but adding others? Plan said "Rename/Map". Let's replace to avoid confusion if FE is strictly using new keys. 
    // Actually FE uses `checkInImageUrl` and `imageUrl`. I will replace `imageInUrl` and `imageOutUrl` with these to be precise, or just add them.
    // Given the plan, let's Replace old fields to match FE exactly.
    private String status ;
    private LocalDateTime timeIn ;
    private LocalDateTime timeOut ;

}

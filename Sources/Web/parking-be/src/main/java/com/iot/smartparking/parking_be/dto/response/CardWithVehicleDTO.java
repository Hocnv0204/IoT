package com.iot.smartparking.parking_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CardWithVehicleDTO {
    private Integer id;
    private String code;
    private String type;
    private String status;
    private LocalDateTime issuedAt;
    private LocalDateTime expiredAt;
    private Integer vehicleId;
    private String licensePlate;
    private String ownerName;
    private String vehicleType;
}


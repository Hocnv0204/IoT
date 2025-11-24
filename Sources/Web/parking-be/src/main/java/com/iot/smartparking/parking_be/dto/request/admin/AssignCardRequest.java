package com.iot.smartparking.parking_be.dto.request.admin;

import lombok.Data;

@Data
public class AssignCardRequest {
    private Integer vehicleId;
    private String cardCode;
    private Integer monthsDuration;
}

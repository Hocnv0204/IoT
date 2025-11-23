package com.iot.smartparking.parking_be.dto.request.admin;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class LogRequest {
    private String licensePlate ;
    private String status ;
    private LocalDateTime fromDate ;
    private LocalDateTime toDate ;
}

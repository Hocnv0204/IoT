package com.iot.smartparking.parking_be.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
@Data
@Builder
public class CardDTO {
    private int id ;
    private String uid ;
    private String status ;
    private String type ;
    private LocalDateTime issuedAt ;
}

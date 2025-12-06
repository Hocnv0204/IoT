package com.iot.smartparking.parking_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class CardDTO {
    private Integer id ;
    private String code ;
    private String type ;
    private String status ;
    private LocalDateTime issuedAt  ;
}

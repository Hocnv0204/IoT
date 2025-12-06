package com.iot.smartparking.parking_be.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Esp32Request {
    private String rfid ;
    private String image ;
}

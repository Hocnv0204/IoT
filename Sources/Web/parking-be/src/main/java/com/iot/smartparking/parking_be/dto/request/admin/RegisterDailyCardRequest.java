package com.iot.smartparking.parking_be.dto.request.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterDailyCardRequest {
    private String rfid ;
}

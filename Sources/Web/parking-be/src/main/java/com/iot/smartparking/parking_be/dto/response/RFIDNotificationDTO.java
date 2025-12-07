package com.iot.smartparking.parking_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RFIDNotificationDTO {
    private String type; // CHECK_IN hoặc CHECK_OUT
    private String rfid; // Mã thẻ RFID
    private Long timestamp; // Timestamp khi nhận được
}



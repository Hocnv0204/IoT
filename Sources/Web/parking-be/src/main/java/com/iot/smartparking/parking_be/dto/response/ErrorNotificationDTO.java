package com.iot.smartparking.parking_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorNotificationDTO {
    private String type; // CHECK_IN hoặc CHECK_OUT hoặc GET_LOGS
    private String rfid; // Mã thẻ RFID (nếu có)
    private int errorCode; // Mã lỗi từ ErrorCode
    private String errorMessage; // Thông báo lỗi
    private Long timestamp; // Timestamp khi xảy ra lỗi
}


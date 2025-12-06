package com.iot.smartparking.parking_be.dto.request.user;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CheckRequest {
    private String rfid ;
}

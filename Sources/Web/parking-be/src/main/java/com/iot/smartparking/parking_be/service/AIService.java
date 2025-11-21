package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.AiResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AIService {
    AiResponse recognizePlate(MultipartFile multipartFile) ;
}

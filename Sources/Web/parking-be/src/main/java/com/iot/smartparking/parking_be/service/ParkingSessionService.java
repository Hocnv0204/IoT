package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.CheckInResponseDTO;
import com.iot.smartparking.parking_be.dto.request.user.CheckRequest;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

public interface ParkingSessionService {
    Mono<CheckInResponseDTO> checkIn(CheckRequest request , MultipartFile image) ;
}

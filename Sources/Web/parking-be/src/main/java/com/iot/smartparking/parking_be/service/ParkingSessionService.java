package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.response.CheckInResponseDTO;
import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.ParkingSessionDTO;
import com.iot.smartparking.parking_be.dto.request.admin.LogRequest;
import com.iot.smartparking.parking_be.dto.request.user.CheckRequest;
import com.iot.smartparking.parking_be.dto.response.CheckOutResponseDTO;
import com.iot.smartparking.parking_be.dto.response.StatisticsResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

public interface ParkingSessionService {
    Mono<CheckInResponseDTO> checkIn(CheckRequest request , MultipartFile image) ;
    PageResponse<ParkingSessionDTO> getLogs(LogRequest request , Pageable pageable) ;
    Mono<StatisticsResponse> getOverviewStatistics() ;
    Mono<CheckOutResponseDTO> checkOut(CheckRequest request , MultipartFile image) ;
}

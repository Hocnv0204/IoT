package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterDailyCardRequest;
import com.iot.smartparking.parking_be.dto.response.CardWithVehicleDTO;
import com.iot.smartparking.parking_be.dto.response.CardDTO;
import org.springframework.data.domain.Pageable;

public interface CardService {
    CardDTO registerDailyCard(RegisterDailyCardRequest request);
    PageResponse<CardWithVehicleDTO> findCards(String status, String type, Pageable pageable);
    CardWithVehicleDTO updateStatus(Integer id, String status);
}

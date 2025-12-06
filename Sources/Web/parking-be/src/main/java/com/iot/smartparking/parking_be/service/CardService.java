package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.request.admin.RegisterDailyCardRequest;
import com.iot.smartparking.parking_be.dto.response.CardDTO;

public interface CardService {
CardDTO registerDailyCard(RegisterDailyCardRequest request) ;
}

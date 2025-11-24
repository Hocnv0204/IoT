package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.CardDTO;
import com.iot.smartparking.parking_be.dto.request.RegisterDailyCard;

public interface CardService {
    CardDTO registerDailyCard(RegisterDailyCard request) ;
}

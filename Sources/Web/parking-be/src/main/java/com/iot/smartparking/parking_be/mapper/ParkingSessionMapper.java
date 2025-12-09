package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.ParkingSessionDTO;
import com.iot.smartparking.parking_be.model.ParkingSession;
import org.springframework.stereotype.Component;

@Component
public class ParkingSessionMapper {
    public ParkingSessionDTO toDto(ParkingSession session){
        return ParkingSessionDTO.builder()
                .status(session.getStatus())
                .licensePlate(session.getVehicle() != null ? session.getVehicle().getLicensePlate() : 
                              (session.getLicensePlateOut() != null ? session.getLicensePlateOut() : session.getLicensePlateIn()))
                .ownerName(session.getVehicle() != null && session.getVehicle().getCustomer() != null ? 
                           session.getVehicle().getCustomer().getFullName() : "Khách vãng lai")
                .checkInImageUrl(session.getImageIn())
                .imageUrl(session.getImageOut())
                .timeIn(session.getTimeIn())
                .timeOut(session.getTimeOut())
                .cardCode(session.getCard() != null ? session.getCard().getCode() : null)
                .cardType(session.getCard() != null ? session.getCard().getType() : null)
                .feeCalculated(session.getFeeCalculated())
                .build() ;
    }
}

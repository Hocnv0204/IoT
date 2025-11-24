package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.ParkingSessionDTO;
import com.iot.smartparking.parking_be.model.ParkingSession;
import org.springframework.stereotype.Component;

@Component
public class ParkingSessionMapper {
    public ParkingSessionDTO toDto(ParkingSession session){
        return ParkingSessionDTO.builder()
                .status(session.getStatus())
                .licensePlate(session.getVehicle().getLicensePlate())
                .ownerName(session.getVehicle().getCustomer() != null ? session.getVehicle().getCustomer().getFullName() : null)
                .imageInUrl(session.getImageIn())
                .imageOutUrl(session.getImageOut())
                .timeIn(session.getTimeIn())
                .timeOut(session.getTimeOut())
                .build() ;
    }
}

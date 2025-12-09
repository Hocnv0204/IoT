package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.response.CardDTO;
import com.iot.smartparking.parking_be.dto.response.CardWithVehicleDTO;
import com.iot.smartparking.parking_be.model.RFIDCard;
import org.springframework.stereotype.Component;

@Component
public class CardMapper {
    public CardDTO toDto(RFIDCard card){
        return CardDTO.builder()
                .id(card.getId())
                .issuedAt(card.getIssuedAt())
                .type(card.getType())
                .status(card.getStatus())
                .code(card.getCode())
                .build() ;
    }

    public CardWithVehicleDTO toCardWithVehicleDto(RFIDCard card){
        return CardWithVehicleDTO.builder()
                .id(card.getId())
                .code(card.getCode())
                .type(card.getType())
                .status(card.getStatus())
                .issuedAt(card.getIssuedAt())
                .expiredAt(card.getExpiredAt())
                .vehicleId(card.getVehicle() != null ? card.getVehicle().getId() : null)
                .licensePlate(card.getVehicle() != null ? card.getVehicle().getLicensePlate() : null)
                .ownerName(card.getVehicle() != null && card.getVehicle().getCustomer() != null
                        ? card.getVehicle().getCustomer().getFullName() : null)
                .vehicleType(card.getVehicle() != null ? card.getVehicle().getType() : null)
                .build();
    }
}

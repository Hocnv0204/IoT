package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.CardDTO;
import com.iot.smartparking.parking_be.model.RFIDCard;
import org.springframework.stereotype.Component;

@Component
public class CardMapper {
    public CardDTO toDto(RFIDCard card){
        return CardDTO.builder()
                .id(card.getId())
                .uid(card.getCode())
                .type(card.getType())
                .issuedAt(card.getIssuedAt())
                .status(card.getStatus())
                .build();
    }
}

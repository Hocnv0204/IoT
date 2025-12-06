package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.response.CardDTO;
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
}

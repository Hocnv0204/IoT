package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.CardStatus;
import com.iot.smartparking.parking_be.common.CardType;
import com.iot.smartparking.parking_be.dto.CardDTO;
import com.iot.smartparking.parking_be.dto.request.RegisterDailyCard;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.mapper.CardMapper;
import com.iot.smartparking.parking_be.model.RFIDCard;
import com.iot.smartparking.parking_be.repository.CardRepository;
import com.iot.smartparking.parking_be.service.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {
    private final CardRepository cardRepository ;
    private final CardMapper cardMapper ;
    @Override
    public CardDTO registerDailyCard(RegisterDailyCard request){
        String uid = request.getUid() ;
        if(cardRepository.existsByCode(uid)){
            throw new AppException(ErrorCode.CARD_ALREADY_EXISTS) ;
        }
        RFIDCard card = RFIDCard.builder()
                .code(uid)
                .type(CardType.DAILY.name())
                .issuedAt(LocalDateTime.now())
                .status(CardStatus.ACTIVE.name())
                .build() ;
        RFIDCard savedCard = cardRepository.save(card) ;
        return cardMapper.toDto(savedCard) ;
    }
}

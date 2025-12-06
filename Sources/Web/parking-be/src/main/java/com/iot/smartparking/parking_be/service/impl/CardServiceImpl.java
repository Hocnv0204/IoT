package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.CardStatus;
import com.iot.smartparking.parking_be.common.CardType;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterDailyCardRequest;
import com.iot.smartparking.parking_be.dto.response.CardDTO;
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
    public CardDTO registerDailyCard(RegisterDailyCardRequest request){
        if(cardRepository.existsByCode(request.getRfid())){
            throw new AppException(ErrorCode.CARD_ALREADY_EXISTS) ;
        }
        RFIDCard card = RFIDCard.builder()
                .code(request.getRfid())
                .status(CardStatus.ACTIVE.name())
                .type(CardType.DAILY.name())
                .issuedAt(LocalDateTime.now())
                .build() ;
        return cardMapper.toDto(cardRepository.save(card)) ;
    }
}

package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.CardStatus;
import com.iot.smartparking.parking_be.common.CardType;
import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterDailyCardRequest;
import com.iot.smartparking.parking_be.dto.response.CardDTO;
import com.iot.smartparking.parking_be.dto.response.CardWithVehicleDTO;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.mapper.CardMapper;
import com.iot.smartparking.parking_be.model.RFIDCard;
import com.iot.smartparking.parking_be.repository.CardRepository;
import com.iot.smartparking.parking_be.service.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {
    private final CardRepository cardRepository ;
    private final CardMapper cardMapper ;

    private CardStatus parseStatus(String status){
        return Arrays.stream(CardStatus.values())
                .filter(s -> s.name().equalsIgnoreCase(status))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CARD_STATUS));
    }

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

    @Override
    public PageResponse<CardWithVehicleDTO> findCards(String status, String type, Pageable pageable) {
        Page<RFIDCard> cardPage;
        if(status != null && type != null){
            cardPage = cardRepository.findAllByStatusAndType(status, type, pageable);
        }else if(status != null){
            cardPage = cardRepository.findAllByStatus(status, pageable);
        }else if(type != null){
            cardPage = cardRepository.findAllByType(type, pageable);
        }else{
            cardPage = cardRepository.findAll(pageable);
        }

        List<CardWithVehicleDTO> content = cardPage.getContent()
                .stream()
                .map(cardMapper::toCardWithVehicleDto)
                .toList();

        return PageResponse.<CardWithVehicleDTO>builder()
                .content(content)
                .pageNumber(cardPage.getNumber())
                .pageSize(cardPage.getSize())
                .totalElements(cardPage.getTotalElements())
                .last(cardPage.isLast())
                .totalPages(cardPage.getTotalPages())
                .build();
    }

    @Override
    public CardWithVehicleDTO updateStatus(Integer id, String status) {
        CardStatus newStatus = parseStatus(status);
        RFIDCard card = cardRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CARD_NOT_FOUND));
        card.setStatus(newStatus.name());
        return cardMapper.toCardWithVehicleDto(cardRepository.save(card));
    }
}

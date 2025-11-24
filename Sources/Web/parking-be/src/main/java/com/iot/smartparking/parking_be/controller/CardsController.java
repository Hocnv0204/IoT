package com.iot.smartparking.parking_be.controller;

import com.iot.smartparking.parking_be.common.CardStatus;
import com.iot.smartparking.parking_be.common.CardType;
import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.request.admin.AssignCardRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.model.RFIDCard;
import com.iot.smartparking.parking_be.model.Vehicle;
import com.iot.smartparking.parking_be.repository.CardRepository;
import com.iot.smartparking.parking_be.repository.VehicleRepository;
import com.iot.smartparking.parking_be.mapper.VehicleMapper;
import com.iot.smartparking.parking_be.utils.PageableUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardsController {
    private final CardRepository cardRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleMapper vehicleMapper;

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<?>> assignCard(@RequestBody AssignCardRequest request){
        if(request.getVehicleId() == null || request.getCardCode() == null || request.getMonthsDuration() == null){
            throw new AppException(ErrorCode.NOT_FOUND);
        }
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        String code = request.getCardCode();
        RFIDCard card;
        if(cardRepository.existsByCode(code)){
            card = cardRepository.findRFIDCardByCode(code).orElseThrow(() -> new AppException(ErrorCode.CARD_NOT_FOUND));
            // If card already linked to another vehicle -> conflict
            if(card.getId() != null && card.getVehicle() != null && !card.getVehicle().getId().equals(vehicle.getId())){
                throw new AppException(ErrorCode.CARD_ALREADY_EXISTS);
            }
        }else{
            card = RFIDCard.builder().code(code).build();
        }

        LocalDateTime now = LocalDateTime.now();
        card.setType(CardType.MONTHLY.name());
        card.setStatus(CardStatus.ACTIVE.name());
        card.setIssuedAt(now);
        card.setExpiredAt(now.plusMonths(request.getMonthsDuration()));

        // Save card then link to vehicle
        cardRepository.save(card);
        vehicle.setCard(card);
        vehicleRepository.save(vehicle);

        return ResponseEntity.ok(
                ApiResponse.builder()
                        .data(vehicleMapper.toDto(vehicle))
                        .message("Assign card successfully")
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> findCards(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "orderBy", required = false) String orderBy
    ){
        Pageable pageable = PageableUtils.setPageable(page, size, orderBy, sortBy);
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

        PageResponse<RFIDCard> resp = PageResponse.<RFIDCard>builder()
                .content(cardPage.getContent())
                .pageNumber(cardPage.getNumber())
                .pageSize(cardPage.getSize())
                .totalElements(cardPage.getTotalElements())
                .last(cardPage.isLast())
                .totalPages(cardPage.getTotalPages())
                .build();

        return ResponseEntity.ok(
                ApiResponse.builder()
                        .data(resp)
                        .message("Get cards")
                        .build()
        );
    }

}

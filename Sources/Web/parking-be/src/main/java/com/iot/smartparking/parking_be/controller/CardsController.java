package com.iot.smartparking.parking_be.controller;

import com.iot.smartparking.parking_be.common.CardStatus;
import com.iot.smartparking.parking_be.common.CardType;
import com.iot.smartparking.parking_be.dto.request.admin.AssignCardRequest;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterDailyCardRequest;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateCardStatusRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.model.RFIDCard;
import com.iot.smartparking.parking_be.model.Vehicle;
import com.iot.smartparking.parking_be.repository.CardRepository;
import com.iot.smartparking.parking_be.repository.VehicleRepository;
import com.iot.smartparking.parking_be.mapper.VehicleMapper;
import com.iot.smartparking.parking_be.service.CardService;
import com.iot.smartparking.parking_be.utils.PageableUtils;
import lombok.RequiredArgsConstructor;
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
    private final CardService cardService ;
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
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .data(cardService.findCards(status, type, pageable))
                        .message("Get cards")
                        .build()
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> updateStatus(@PathVariable Integer id,
                                                       @RequestBody UpdateCardStatusRequest request){
        if(request.getStatus() == null){
            throw new AppException(ErrorCode.INVALID_CARD_STATUS);
        }
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .data(cardService.updateStatus(id, request.getStatus()))
                        .message("Update status successfully")
                        .build()
        );
    }
    @PostMapping("/register-daily")
    public ResponseEntity<ApiResponse<?>> registerDailyCard(@RequestBody RegisterDailyCardRequest request){
        return ResponseEntity.ok().body(
                ApiResponse.builder()
                        .data(cardService.registerDailyCard(request))
                        .message("Register daily card successfully")
                        .build()
        ) ;
    }
}

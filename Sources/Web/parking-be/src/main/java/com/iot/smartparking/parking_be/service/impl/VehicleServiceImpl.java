package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.CardType;
import com.iot.smartparking.parking_be.common.CardStatus;
import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.VehicleDTO;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterVehicle;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateCardVehicle;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateVehicle;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.mapper.PageMapper;
import com.iot.smartparking.parking_be.mapper.VehicleMapper;
import com.iot.smartparking.parking_be.model.RFIDCard;
import com.iot.smartparking.parking_be.model.Vehicle;
import com.iot.smartparking.parking_be.repository.CardRepository;
import com.iot.smartparking.parking_be.repository.VehicleRepository;
import com.iot.smartparking.parking_be.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {
    private final VehicleRepository vehicleRepository ;
    private final CardRepository cardRepository ;
    private final VehicleMapper vehicleMapper ;
    private final PageMapper pageMapper ;
    @Override
    public VehicleDTO register(RegisterVehicle request){
        if(vehicleRepository.existsByLicensePlate(request.getLicensePlate())){
            throw new AppException(ErrorCode.VEHICLE_ALREADY_EXISTS) ;
        }
        if(cardRepository.existsByCode(request.getRfidUid())){
            throw new AppException(ErrorCode.CARD_ALREADY_EXISTS) ;
        }
        RFIDCard card = RFIDCard.builder()
                .type(CardType.MONTHLY.name())
                .code(request.getRfidUid())
                .status(CardStatus.ACTIVE.name())
                .issuedAt(LocalDateTime.now())
                .build() ;

        Vehicle vehicle = Vehicle.builder()
                .type(request.getVehicleType())
                .licensePlate(request.getLicensePlate())
                .card(card)
                .status("ASSIGNED")
                .ownerName(request.getOwnerName())
                .build() ;
        cardRepository.save(card) ;
        vehicleRepository.save(vehicle) ;
        return vehicleMapper.toDto(vehicle) ;
    }
    @Override
    public VehicleDTO getVehicle(int vehicleId){
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElseThrow(
                () -> new AppException(ErrorCode.VEHICLE_NOT_FOUND)
        ) ;
        return vehicleMapper.toDto(vehicle) ;
    }

    @Override
    public VehicleDTO updateVehicle(UpdateVehicle update , int vehicleId){
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElseThrow(
                () -> new AppException(ErrorCode.VEHICLE_NOT_FOUND)
        ) ;
        if(update.getType() != null ) {
            vehicle.setType(update.getType());
        }
        if(update.getOwnerName()!= null) {
            vehicle.setOwnerName(update.getOwnerName());
        }
        if(update.getLicensePlate() != null) {
            vehicle.setLicensePlate(update.getLicensePlate());
        }
        if(update.getStatus() != null) {
            vehicle.setStatus(update.getStatus());
        }
        return vehicleMapper.toDto(vehicleRepository.save(vehicle)) ;
    }

    @Override
    public VehicleDTO updateCard(UpdateCardVehicle request , int id){
        Vehicle vehicle = vehicleRepository.findById(id).orElseThrow(
                () -> new AppException(ErrorCode.VEHICLE_NOT_FOUND)
        ) ;
        RFIDCard card = vehicle.getCard();
        if(cardRepository.existsByCode(card.getCode())){
            throw new AppException(ErrorCode.CARD_NOT_FOUND) ;
        }
        RFIDCard newCard =  RFIDCard.builder()
                .type(CardType.MONTHLY.name())
                .code(request.getRfidUid())
                .status(CardStatus.ACTIVE.name())
                .issuedAt(LocalDateTime.now())
                .build() ;
        vehicle.setCard(newCard);
        cardRepository.delete(card);
        cardRepository.save(newCard) ;
        return vehicleMapper.toDto(vehicleRepository.save(vehicle)) ;

    }

    @Override
    public PageResponse<VehicleDTO> findAll(Pageable pageable){
        Page<Vehicle> page = vehicleRepository.findAll(pageable);
        Page<VehicleDTO> pageDto = page.map(vehicleMapper :: toDto) ;
        return pageMapper.toPageResponse(pageDto) ;
    }
}

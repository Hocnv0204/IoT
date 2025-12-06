package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.CardType;
import com.iot.smartparking.parking_be.common.CardStatus;
import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.VehicleDTO;
import com.iot.smartparking.parking_be.dto.request.CreateVehicleRequest;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterVehicle;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateCardVehicle;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateVehicle;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.mapper.PageMapper;
import com.iot.smartparking.parking_be.mapper.VehicleMapper;
import com.iot.smartparking.parking_be.model.Customer;
import com.iot.smartparking.parking_be.model.RFIDCard;
import com.iot.smartparking.parking_be.model.Vehicle;
import com.iot.smartparking.parking_be.repository.CardRepository;
import com.iot.smartparking.parking_be.repository.CustomerRepository;
import com.iot.smartparking.parking_be.repository.VehicleRepository;
import com.iot.smartparking.parking_be.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {
    private final VehicleRepository vehicleRepository ;
    private final CardRepository cardRepository ;
    private final CustomerRepository customerRepository ;
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

        // Tìm hoặc tạo Customer
        Customer customer = customerRepository.findByFullName(request.getOwnerName())
                .orElseGet(() -> {
                    Customer newCustomer = Customer.builder()
                            .fullName(request.getOwnerName())
                            .build();
                    return customerRepository.save(newCustomer);
                });

        Vehicle vehicle = Vehicle.builder()
                .type(request.getVehicleType())
                .licensePlate(request.getLicensePlate())
                .card(card)
                .status("ASSIGNED")
                .customer(customer)
                .build() ;
        cardRepository.save(card) ;
        vehicleRepository.save(vehicle) ;
        return vehicleMapper.toDto(vehicle) ;
    }

    @Override
    public VehicleDTO createVehicle(CreateVehicleRequest request) {
        // Kiểm tra biển số xe đã tồn tại chưa
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new AppException(ErrorCode.VEHICLE_ALREADY_EXISTS);
        }

        // Tìm customer theo ID
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        // Tạo vehicle mới
        Vehicle vehicle = Vehicle.builder()
                .licensePlate(request.getLicensePlate())
                .type(request.getType())
                .brand(request.getBrand())
                .color(request.getColor())
                .card(null)
                .customer(customer)
                .status("ACTIVE")
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return vehicleMapper.toDto(savedVehicle);
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
            // Tìm hoặc tạo Customer
            Customer customer = customerRepository.findByFullName(update.getOwnerName())
                    .orElseGet(() -> {
                        Customer newCustomer = Customer.builder()
                                .fullName(update.getOwnerName())
                                .build();
                        return customerRepository.save(newCustomer);
                    });
            vehicle.setCustomer(customer);
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
        RFIDCard oldCard = vehicle.getCard();
        // Kiểm tra xem card mới có trùng với card khác không (trừ card hiện tại)
        if(cardRepository.existsByCode(request.getRfidUid())){
            // Nếu card mới trùng với card hiện tại thì không lỗi
            if(oldCard == null || !oldCard.getCode().equals(request.getRfidUid())){
                throw new AppException(ErrorCode.CARD_ALREADY_EXISTS) ;
            }
        }
        RFIDCard newCard =  RFIDCard.builder()
                .type(CardType.MONTHLY.name())
                .code(request.getRfidUid())
                .status(CardStatus.ACTIVE.name())
                .issuedAt(LocalDateTime.now())
                .build() ;
        vehicle.setCard(newCard);
        if(oldCard != null) {
            cardRepository.delete(oldCard);
        }
        cardRepository.save(newCard) ;
        return vehicleMapper.toDto(vehicleRepository.save(vehicle)) ;

    }

    @Override
    public PageResponse<VehicleDTO> findAll(Pageable pageable){
        Page<Vehicle> page = vehicleRepository.findAll(pageable);
        Page<VehicleDTO> pageDto = page.map(vehicleMapper :: toDto) ;
        return pageMapper.toPageResponse(pageDto) ;
    }

    @Override
    public List<VehicleDTO> searchVehicles(Integer customerId, String plate) {
        // If customerId provided, fetch vehicles by customer and optionally filter by plate
        if (customerId != null) {
            List<Vehicle> vehicles = vehicleRepository.findByCustomerId(customerId);
            if (plate != null && !plate.trim().isEmpty()) {
                String p = plate.toLowerCase();
                return vehicles.stream()
                        .filter(v -> v.getLicensePlate() != null && v.getLicensePlate().toLowerCase().contains(p))
                        .map(vehicleMapper::toDto)
                        .collect(Collectors.toList());
            }
            return vehicles.stream().map(vehicleMapper::toDto).collect(Collectors.toList());
        }

        // If only plate provided, use repository method
        if (plate != null && !plate.trim().isEmpty()) {
            List<Vehicle> vehicles = vehicleRepository.findByLicensePlateContainingIgnoreCase(plate);
            return vehicles.stream().map(vehicleMapper::toDto).collect(Collectors.toList());
        }

        // If no params provided, return empty list to avoid huge results
        return List.of();
    }
}

package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.VehicleDTO;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterVehicle;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateCardVehicle;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateVehicle;
import org.springframework.data.domain.Pageable;


public interface VehicleService {
    VehicleDTO register(RegisterVehicle request) ;

    VehicleDTO getVehicle(int vehicleId) ;

    VehicleDTO updateVehicle(UpdateVehicle update , int id ) ;

    VehicleDTO updateCard(UpdateCardVehicle update , int id ) ;

    PageResponse<VehicleDTO> findAll(Pageable pageable) ;
}

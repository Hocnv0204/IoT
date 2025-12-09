package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.VehicleDTO;
import com.iot.smartparking.parking_be.model.Vehicle;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {
    public VehicleDTO toDto(Vehicle vehicle){
        return VehicleDTO.builder()
                .id(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .owner(vehicle.getCustomer() != null ? vehicle.getCustomer().getFullName() : null)
                .customerId(vehicle.getCustomer() != null ? vehicle.getCustomer().getId() : null)
                .vehicleType(vehicle.getType())
                .build();
    }
}

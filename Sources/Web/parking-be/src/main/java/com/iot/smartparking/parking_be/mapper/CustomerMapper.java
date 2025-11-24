package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.CustomerDTO;
import com.iot.smartparking.parking_be.model.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {
    public CustomerDTO toDto(Customer customer) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phoneNumber(customer.getPhoneNumber())
                .identityCard(customer.getIdentityCard())
                .build();
    }
}


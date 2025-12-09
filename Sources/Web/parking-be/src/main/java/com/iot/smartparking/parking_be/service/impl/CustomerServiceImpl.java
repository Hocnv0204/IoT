package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.dto.CustomerDTO;
import com.iot.smartparking.parking_be.dto.request.CreateCustomerRequest;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.mapper.CustomerMapper;
import com.iot.smartparking.parking_be.model.Customer;
import com.iot.smartparking.parking_be.repository.CustomerRepository;
import com.iot.smartparking.parking_be.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.iot.smartparking.parking_be.dto.request.UpdateCustomerRequest;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {
    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;

    @Override
    public CustomerDTO createCustomer(CreateCustomerRequest request) {
        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .identityCard(request.getIdentityCard())
                .build();
        
        Customer savedCustomer = customerRepository.save(customer);
        return customerMapper.toDto(savedCustomer);
    }

    @Override
    public CustomerDTO updateCustomer(Integer customerId, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        customer.setFullName(request.getFullName());
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setIdentityCard(request.getIdentityCard());

        Customer updatedCustomer = customerRepository.save(customer);
        return customerMapper.toDto(updatedCustomer);
    }

    @Override
    public CustomerDTO getCustomerById(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
        return customerMapper.toDto(customer);
    }

    @Override
    public List<CustomerDTO> searchCustomers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllCustomers();
        }
        List<Customer> customers = customerRepository.findByFullNameContainingIgnoreCaseOrPhoneNumberContainingOrIdentityCardContaining(query, query, query);
        return customers.stream().map(customerMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(customerMapper::toDto)
                .collect(Collectors.toList());
    }
}


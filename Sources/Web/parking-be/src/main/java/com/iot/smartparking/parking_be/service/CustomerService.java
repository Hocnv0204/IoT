package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.CustomerDTO;
import com.iot.smartparking.parking_be.dto.request.CreateCustomerRequest;
import com.iot.smartparking.parking_be.dto.request.UpdateCustomerRequest;
import java.util.List;

public interface CustomerService {
    CustomerDTO createCustomer(CreateCustomerRequest request);
    CustomerDTO updateCustomer(Integer customerId, UpdateCustomerRequest request);
    CustomerDTO getCustomerById(Integer customerId);
    List<CustomerDTO> searchCustomers(String query);
    List<CustomerDTO> getAllCustomers();
}


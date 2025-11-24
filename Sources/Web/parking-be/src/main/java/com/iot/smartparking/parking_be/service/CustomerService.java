package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.CustomerDTO;
import com.iot.smartparking.parking_be.dto.request.CreateCustomerRequest;
import java.util.List;

public interface CustomerService {
    CustomerDTO createCustomer(CreateCustomerRequest request);
    CustomerDTO getCustomerById(Integer customerId);
    List<CustomerDTO> searchCustomers(String query);
}


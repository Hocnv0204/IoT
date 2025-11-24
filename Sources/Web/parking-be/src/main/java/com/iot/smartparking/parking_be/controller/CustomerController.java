package com.iot.smartparking.parking_be.controller;

import com.iot.smartparking.parking_be.dto.request.CreateCustomerRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createCustomer(@RequestBody CreateCustomerRequest request) {
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(customerService.createCustomer(request))
                                .message("Tạo khách hàng mới thành công")
                                .build()
                );
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<?>> getCustomerById(@PathVariable Integer customerId) {
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(customerService.getCustomerById(customerId))
                                .message("Lấy thông tin khách hàng thành công")
                                .build()
                );
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<?>> searchCustomers(@RequestParam(name = "query") String query) {
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(customerService.searchCustomers(query))
                                .message("Tìm khách hàng thành công")
                                .build()
                );
    }
}


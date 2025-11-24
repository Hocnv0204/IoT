package com.iot.smartparking.parking_be.controller;

import com.iot.smartparking.parking_be.dto.request.CreateVehicleRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehiclesController {
    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createVehicle(@RequestBody CreateVehicleRequest request) {
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(vehicleService.createVehicle(request))
                                .message("Đăng ký xe cho khách hàng thành công")
                                .build()
                );
    }

        @GetMapping("/search")
        public ResponseEntity<ApiResponse<?>> searchVehicles(
            @RequestParam(name = "customerId", required = false) Integer customerId,
            @RequestParam(name = "plate", required = false) String plate
        ) {
        return ResponseEntity.ok()
            .body(
                ApiResponse.builder()
                    .data(vehicleService.searchVehicles(customerId, plate))
                    .message("Tìm kiếm xe thành công")
                    .build()
            );
        }
}


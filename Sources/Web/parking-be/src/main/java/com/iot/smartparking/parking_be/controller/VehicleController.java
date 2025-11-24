package com.iot.smartparking.parking_be.controller;

import com.iot.smartparking.parking_be.dto.request.CreateVehicleRequest;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterVehicle;
import com.iot.smartparking.parking_be.dto.request.admin.UpdateVehicle;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.service.VehicleService;
import com.iot.smartparking.parking_be.utils.PageableUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicle")
@RequiredArgsConstructor
public class VehicleController {
    private final VehicleService vehicleService ;
    
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
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register (@RequestBody RegisterVehicle request){
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(vehicleService.register(request))
                                .message("Register vehicle successfully")
                                .build()
                ) ;
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<ApiResponse<?>> getVehicle(@PathVariable int vehicleId){
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(vehicleService.getVehicle(vehicleId))
                                .message("Get information about vehicle")
                                .build()
                ) ;
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<ApiResponse<?>> updateVehicle(@PathVariable int vehicleId , @RequestBody UpdateVehicle request){
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(vehicleService.updateVehicle(request , vehicleId))
                                .message("Update information vehicle successfully")
                                .build()
                ) ;
    }

    @GetMapping("/find-all")
    public ResponseEntity<ApiResponse<?>> findAll(
            @RequestParam(value = "page" , required = false) Integer page ,
            @RequestParam(value = "size" , required = false) Integer size ,
            @RequestParam(value =  "sortBy" , required = false) String sortBy ,
            @RequestParam(value = "orderBy" , required = false) String orderBy){
        Pageable pageable = PageableUtils.setPageable(page , size , orderBy , sortBy) ;
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(vehicleService.findAll(pageable))
                                .message("Find all vehicle")
                                .build()
                ) ;
    }

}

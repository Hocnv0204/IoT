package com.iot.smartparking.parking_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.smartparking.parking_be.dto.request.admin.LogRequest;
import com.iot.smartparking.parking_be.dto.request.user.CheckRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.dto.response.StatisticsResponse;
import com.iot.smartparking.parking_be.service.ParkingSessionService;
import com.iot.smartparking.parking_be.utils.PageableUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/parking-session")
@RequiredArgsConstructor
@Slf4j
public class ParkingSessionController {
    private final ParkingSessionService parkingSessionService ;
    
    // Trạng thái hiện tại của hệ thống
    // Có thể là: "IDLE", "SCANNING", "CHECKIN", "CHECKOUT", etc.
    private volatile String currentStatus = "IDLE";
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE , path = "/checkin")
    public Mono<ResponseEntity<ApiResponse<?>>> checkin(
            @RequestPart("image")MultipartFile image,
            @RequestPart("rfid") String rfidCard
            ){
        ObjectMapper objectMapper = new ObjectMapper() ;
        CheckRequest checkRequest = null ;
        try{
            checkRequest = objectMapper.readValue(rfidCard , CheckRequest.class);
        }catch (Exception e){
            throw  new RuntimeException("Invalid request body") ;
        }
        return parkingSessionService.checkIn(checkRequest , image).map(
                response -> ResponseEntity.ok()
                        .body(
                                ApiResponse.builder()
                                        .data(response)
                                        .message("Checkin successfully")
                                        .build()
                        )
        ) ;
    }
    @GetMapping("/get-logs")
    public ResponseEntity<ApiResponse<?>> getLogs(
            @RequestParam(value = "pageNumber" , required = false) Integer pageNumber,
            @RequestParam(value = "pageSize" , required = false) Integer pageSize ,
            @RequestParam(value = "sortBy" , required = false) String sortBy ,
            @RequestParam(value = "orderBy" , required = false) String orderBy,
            @RequestParam(value = "status" , required = false) String status ,
            @RequestParam(value = "fromDate" , required = false) LocalDateTime fromDate ,
            @RequestParam(value = "toDate" , required = false) LocalDateTime toDate ,
            @RequestParam(value = "licensePlate" , required = false) String licensePlate
    ) {
        Pageable pageable = PageableUtils.setPageable(pageNumber , pageSize , orderBy , sortBy) ;
        LogRequest request = new LogRequest(licensePlate , status , fromDate , toDate) ;
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(parkingSessionService.getLogs(request , pageable))
                                .message("Get log by date ")
                                .build()
                ) ;
    }


    @GetMapping("/overview")
    public Mono<ResponseEntity<ApiResponse<StatisticsResponse>>> getOverview() {
        return parkingSessionService.getOverviewStatistics()
                .map(stats -> ResponseEntity.ok(
                        ApiResponse.<StatisticsResponse>builder()
                                .data(stats)
                                .message("Lấy số liệu thống kê thành công")
                                .build()
                ));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE , path = "/checkout")
    public Mono<ResponseEntity<ApiResponse<?>>> checkout(
            @RequestPart("image")MultipartFile image,
            @RequestPart("rfid") String rfidCard
    ){
        ObjectMapper objectMapper = new ObjectMapper() ;
        CheckRequest checkRequest = null ;
        try{
            checkRequest = objectMapper.readValue(rfidCard , CheckRequest.class);
        }catch (Exception e){
            throw  new RuntimeException("Invalid request body") ;
        }
        return parkingSessionService.checkOut(checkRequest , image).map(
                response -> ResponseEntity.ok()
                        .body(
                                ApiResponse.builder()
                                        .data(response)
                                        .message("Checkout successfully")
                                        .build()
                        )
        ) ;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<String>> getStatus() {
        return ResponseEntity.ok()
                .body(
                        ApiResponse.<String>builder()
                                .data(currentStatus)
                                .message("Lấy trạng thái hiện tại thành công")
                                .build()
                );
    }

    @PostMapping("/status")
    public ResponseEntity<ApiResponse<String>> setStatus(@RequestParam(required = false) String status) {
        String previousStatus = currentStatus;
        if (status != null && !status.isEmpty()) {
            currentStatus = status;
        } else {
            // Nếu không có status, reset về IDLE
            currentStatus = "IDLE";
        }
        log.info("Trạng thái hệ thống đã được cập nhật: {} -> {}", previousStatus, currentStatus);
        return ResponseEntity.ok()
                .body(
                        ApiResponse.<String>builder()
                                .data(currentStatus)
                                .message("Đã cập nhật trạng thái thành: " + currentStatus)
                                .build()
                );
    }

}

package com.iot.smartparking.parking_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.smartparking.parking_be.configuration.Base64DecodedMultipartFile;
import com.iot.smartparking.parking_be.configuration.ParkingStateContext;
import com.iot.smartparking.parking_be.dto.request.Esp32Request;
import com.iot.smartparking.parking_be.dto.request.admin.LogRequest;
import com.iot.smartparking.parking_be.dto.request.admin.RegisterDailyCardRequest;
import com.iot.smartparking.parking_be.dto.request.user.CheckRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.dto.response.StatisticsResponse;

import com.iot.smartparking.parking_be.model.ParkingSession;
import com.iot.smartparking.parking_be.service.CardService;


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

    private final ParkingStateContext stateContext;
    @PostMapping("/status")
    public ResponseEntity<ApiResponse<?>> setStatus(@RequestParam String status) {
        if (!status.matches("(?i)CHECKIN|CHECKOUT|REGISTER")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                            .message("Invalid status")
                            .build());
        }

        stateContext.setCurrentStatus(status);

        return ResponseEntity.ok(
                ApiResponse.builder()
                        .message("Status updated to " + status)
                        .build()
        );
    }
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<ApiResponse<?>>> scan(
            @RequestPart("image") MultipartFile image,
            @RequestPart("rfid") String rfidCard
    ) {
        String status = stateContext.getCurrentStatus();
        CheckRequest request = new CheckRequest();
        request.setRfid(rfidCard);

        Mono<?> result;

        switch (status) {
            case "CHECKIN":
                result = parkingSessionService.checkIn(request, image);
                break;
            case "CHECKOUT":
                result = parkingSessionService.checkOut(request, image);
                break;
            case "REGISTER":
                // Không làm gì cả
                return Mono.just(ResponseEntity.ok(
                        ApiResponse.builder()
                                .message("System in REGISTER mode, no action taken")
                                .build()
                ));
            default:
                return Mono.just(ResponseEntity.badRequest()
                        .body(ApiResponse.builder().message("Unknown status").build()));
        }

        return result.map(response -> ResponseEntity.ok(
                ApiResponse.builder()
                        .data(response)
                        .message(status + " successfully")
                        .build()
        ));
    }



    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE , path = "/checkin")
    public Mono<ResponseEntity<ApiResponse<?>>> checkin(
            @RequestPart("image")MultipartFile image,
            @RequestPart("rfid") String rfidCard
            ){
        CheckRequest checkRequest = new CheckRequest();
        checkRequest.setRfid(rfidCard);
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
    @PostMapping("/checkin-json")
    public Mono<ResponseEntity<ApiResponse<?>>> checkinJson(@RequestBody Esp32Request request) {
        try {
            // Xử lý Base64
            String base64Image = request.getImage();
            if (base64Image.contains(",")) {
                base64Image = base64Image.split(",")[1];
            }

            byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Image);

            MultipartFile multipartFile =
                    new Base64DecodedMultipartFile(imageBytes, "esp32-" + System.currentTimeMillis() + ".jpg");

            CheckRequest checkRequest = new CheckRequest();
            checkRequest.setRfid(request.getRfid());

            return parkingSessionService.checkIn(checkRequest, multipartFile)
                    .map(response -> ResponseEntity.ok(
                            ApiResponse.builder()
                                    .data(response)
                                    .message("Checkin successfully")
                                    .build()
                    ));
        } catch (Exception e) {
            e.printStackTrace();
            return Mono.just(ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                            .message("Checkin failed: " + e.getMessage())
                            .build()));
        }
    }



}

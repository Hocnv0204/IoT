package com.iot.smartparking.parking_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.smartparking.parking_be.dto.request.user.CheckRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.model.ParkingSession;
import com.iot.smartparking.parking_be.service.ParkingSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/parking-session")
@RequiredArgsConstructor
public class ParkingSessionController {
    private final ParkingSessionService parkingSessionService ;
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
}

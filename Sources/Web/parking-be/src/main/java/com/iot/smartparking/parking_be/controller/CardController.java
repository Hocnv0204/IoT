package com.iot.smartparking.parking_be.controller;

import com.iot.smartparking.parking_be.dto.request.RegisterDailyCard;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.service.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/card")
@RequiredArgsConstructor
public class CardController {
    private final CardService cardService ;
    @PostMapping("/register-daily")
    public ResponseEntity<ApiResponse<?>> registerDailyCard(@RequestBody RegisterDailyCard request){
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .message("Register card successfully")
                                .data(cardService.registerDailyCard(request))
                                .build()
                ) ;
    }
}

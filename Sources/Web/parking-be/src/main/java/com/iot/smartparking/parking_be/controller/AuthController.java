package com.iot.smartparking.parking_be.controller;

import com.iot.smartparking.parking_be.dto.request.auth.LoginRequest;
import com.iot.smartparking.parking_be.dto.request.auth.RegisterRequest;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@RequestBody LoginRequest request){
        return ResponseEntity.ok().body(
                ApiResponse.builder()
                        .data(authService.login(request))
                        .message("Login successful")
                        .build()
        ) ;
    }


    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody RegisterRequest request){
        return ResponseEntity.ok()
                .body(
                        ApiResponse.builder()
                                .data(authService.register(request))
                                .message("Register successful")
                                .build()
                ) ;
    }
}

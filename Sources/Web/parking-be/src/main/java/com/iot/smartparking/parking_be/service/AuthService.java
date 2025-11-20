package com.iot.smartparking.parking_be.service;

import com.iot.smartparking.parking_be.dto.request.auth.IntrospectRequest;
import com.iot.smartparking.parking_be.dto.request.auth.LoginRequest;
import com.iot.smartparking.parking_be.dto.request.auth.RegisterRequest;
import com.iot.smartparking.parking_be.dto.response.auth.AuthenticationResponse;
import com.iot.smartparking.parking_be.dto.response.auth.IntrospectResponse;
import com.iot.smartparking.parking_be.model.User;

public interface AuthService {
    AuthenticationResponse register(RegisterRequest registerRequest) ;
    AuthenticationResponse login(LoginRequest request) ;
    IntrospectResponse introspect(IntrospectRequest request) ;
    String generateAccessToken(User user) ;
    String generateRefreshToken(User user) ;
}
package com.iot.smartparking.parking_be.dto.request.auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String username ;
    private String password ;
}

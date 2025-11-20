package com.iot.smartparking.parking_be.dto.response.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthenticationResponse {
    private String accessToken ;
    private String refreshToken ;
}

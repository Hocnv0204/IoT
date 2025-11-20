package com.iot.smartparking.parking_be.dto.request.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IntrospectRequest {
    private String token ;
}

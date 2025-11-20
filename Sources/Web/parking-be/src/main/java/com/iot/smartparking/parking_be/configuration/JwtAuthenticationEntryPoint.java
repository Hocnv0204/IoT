package com.iot.smartparking.parking_be.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;

public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse , AuthenticationException exception) throws IOException {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED ;
        httpServletResponse.setStatus(errorCode.getHttpStatus().value()) ;
        httpServletResponse.setContentType(MediaType.APPLICATION_JSON_VALUE) ;
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .data(null)
                .message(errorCode.getMessage())
                .build();
        ObjectMapper objectMapper = new ObjectMapper() ;
        httpServletResponse.getWriter().write(objectMapper.writeValueAsString(apiResponse));
        httpServletResponse.flushBuffer();
    }
}

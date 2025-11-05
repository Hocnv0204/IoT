package com.iot.smartparking.parking_be.exception;

import com.iot.smartparking.parking_be.dto.response.ApiErrorResponse;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandle {
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex){
        ApiResponse response = new ApiResponse<>(ex.getErrorCode()) ;
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus()).body(response) ;
    }
}

package com.iot.smartparking.parking_be.exception;

import com.iot.smartparking.parking_be.dto.response.ApiErrorResponse;
import com.iot.smartparking.parking_be.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandle {
    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<?>> handlingAppException(AppException ex){
        ErrorCode errorCode = ex.getErrorCode() ;
        return ResponseEntity.status(errorCode.getHttpStatus()).body(
                ApiResponse.builder()
                        .apiErrorResponse(new ApiErrorResponse(errorCode))
                        .message(errorCode.getMessage())
                        .build()
        ) ;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handlingRuntimeException(Exception ex){
        if(ex instanceof AccessDeniedException){
            ErrorCode errorCode = ErrorCode.FORBIDDEN ;
            return ResponseEntity.status(errorCode.getHttpStatus())
                    .body(
                            ApiResponse.builder()
                                    .apiErrorResponse(new ApiErrorResponse(errorCode))
                                    .message(errorCode.getMessage())
                                    .build()
                    ) ;
        }
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR ;
        return ResponseEntity.status(errorCode.getHttpStatus()).body(
                ApiResponse.builder()
                        .apiErrorResponse(new ApiErrorResponse(errorCode))
                        .message(errorCode.getMessage())
                        .build()
        ) ;

    }
}

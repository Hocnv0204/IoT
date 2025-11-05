package com.iot.smartparking.parking_be.dto.response;

import com.iot.smartparking.parking_be.exception.ErrorCode;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.HttpStatus;

@Data
@Builder
public class ApiErrorResponse {
    private int code;
    private String message ;
    private HttpStatus httpStatus ;

    public ApiErrorResponse(ErrorCode errorCode){
        this.code = errorCode.getCode() ;
        this.message = errorCode.getMessage() ;
        this.httpStatus = errorCode.getHttpStatus() ;
    }
}

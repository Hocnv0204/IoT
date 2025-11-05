package com.iot.smartparking.parking_be.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse <T> {
    private T data ;
    private String message ;
    private ApiErrorResponse apiErrorResponse ;
    public ApiResponse(ErrorCode errorCode){
        this.apiErrorResponse = new ApiErrorResponse(errorCode) ;
    }

}

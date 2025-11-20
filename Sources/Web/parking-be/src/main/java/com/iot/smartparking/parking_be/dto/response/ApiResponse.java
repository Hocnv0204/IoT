package com.iot.smartparking.parking_be.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse <T> {
    private T data ;
    private String message ;
    private ApiErrorResponse apiErrorResponse ;
    public ApiResponse(ErrorCode errorCode){
        this.apiErrorResponse = new ApiErrorResponse(errorCode) ;
    }

}

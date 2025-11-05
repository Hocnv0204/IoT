package com.iot.smartparking.parking_be.exception;

import lombok.Data;
import lombok.Getter;
import org.springframework.http.HttpStatus;
@Getter
public enum ErrorCode {
    CARD_NOT_FOUND(404 , "Not found card" , HttpStatus.NOT_FOUND)  ;
    private final int code ;
    private final String message ;
    private final HttpStatus httpStatus ;
    ErrorCode (int code , String message , HttpStatus httpStatus){
        this.code = code ;
        this.message = message ;
        this.httpStatus = httpStatus ;
    }
}

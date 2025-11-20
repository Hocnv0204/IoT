package com.iot.smartparking.parking_be.exception;

import lombok.Data;
import lombok.Getter;
import org.springframework.http.HttpStatus;
@Getter
public enum ErrorCode {
    CARD_NOT_FOUND(404 , "Not found card" , HttpStatus.NOT_FOUND),
    FORBIDDEN(403, "Forbidden", HttpStatus.FORBIDDEN) ,
    NOT_FOUND(404, "Not Found", HttpStatus.NOT_FOUND) ,
    INTERNAL_SERVER_ERROR(500, "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(401, "Unauthorized", HttpStatus.UNAUTHORIZED) ,
    USER_NOT_FOUND(404 , "User not found", HttpStatus.NOT_FOUND) ;
    private final int code ;
    private final String message ;
    private final HttpStatus httpStatus ;
    ErrorCode (int code , String message , HttpStatus httpStatus){
        this.code = code ;
        this.message = message ;
        this.httpStatus = httpStatus ;
    }
}

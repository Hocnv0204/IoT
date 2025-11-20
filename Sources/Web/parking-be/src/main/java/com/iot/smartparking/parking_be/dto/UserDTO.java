package com.iot.smartparking.parking_be.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserDTO {
    private String username ;
    private String name ;
    private String email ;
    private String phoneNumber ;
    private String role ;
    private int id ;
}

package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.UserDTO;
import com.iot.smartparking.parking_be.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserDTO toUserDTO(User user){
        return UserDTO.builder()
                .email(user.getEmail())
                .name(user.getFullName())
                .phoneNumber(user.getPhone())
                .role(user.getRole())
                .username(user.getUsername())
                .id(user.getId())
                .build() ;

    }
}

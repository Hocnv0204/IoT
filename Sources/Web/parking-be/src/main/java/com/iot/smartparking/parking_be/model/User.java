package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name="user")
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@RequiredArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;
    String username ;
    String password ;
    String email;
    String role ;
    String name ;
    String phone  ;
    @Column(name = "created_at")
    LocalDateTime createdAt ;
    @Column(name = "updated_at")
    LocalDateTime updatedAt ;

}

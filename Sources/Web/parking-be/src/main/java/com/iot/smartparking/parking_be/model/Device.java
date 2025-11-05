package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Table(name = "device")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;

    String name ;
    String type ;
    String status ;
    @Column(name = "ip_address")
    String ipAddress ;
}

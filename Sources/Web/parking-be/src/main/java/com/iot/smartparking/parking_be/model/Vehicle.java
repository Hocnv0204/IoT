package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Table(name = "vehicle")
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;
    @Column(name = "license_plate")
    String licensePlate ;
    String type ;

    @ManyToOne
    @JoinColumn(name = "user_id" , nullable = false)
    User user;
    @OneToMany
    List<ParkingSession> parkingSessions ;
}

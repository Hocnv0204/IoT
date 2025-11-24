package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Table(name = "vehicle")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;

    @Column(name = "license_plate")
    String licensePlate ;
    // Car / motorbike
    String type ;

    @Column(name = "owner_name" , nullable = false)
    private String ownerName ;

    @OneToOne
    @JoinColumn(name = "card_id" , nullable = false)
    RFIDCard card ;

    @OneToMany(mappedBy = "vehicle")
    List<ParkingSession> parkingSessions ;


}

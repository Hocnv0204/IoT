package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;
    @Column(name = "license_plate")
    String licensePlate ;
    @Column(name = "time_in")
    LocalDateTime timeIn ;
    @Column(name = "time_out")
    LocalDateTime timeOut ;
    @Column(name = "image_in")
    String imageIn ;
    @Column(name = "image_out")
    String imageOut ;
    @Column(name = "fee_calculated")
    Double feeCalculated ;
    @ManyToOne
    @JoinColumn(name = "card_id")
    RFIDCard card ;

    private String status ;
}

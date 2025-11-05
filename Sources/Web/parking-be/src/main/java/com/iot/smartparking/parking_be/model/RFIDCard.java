package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "card")
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RFIDCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;

    String code ;

    String type ;
    String status ;
    @Column(name = "issued_at")
    LocalDateTime issuedAt ;
    @Column(name = "expired_at")
    LocalDateTime expiredAt ;

    @ManyToOne
    @JoinColumn(name = "user_id")
    User user ;

    @OneToMany
    List<ParkingSession> parkingSessions ;
}

package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "card")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RFIDCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id ;
    // RFID UID
    String code ;
    // MONTHLY / DAILY
    String type ;
    // ACTIVE / INACTIVE
    String status ;

    @Column(name = "issued_at")
    LocalDateTime issuedAt ;
    @Column(name = "expired_at")
    LocalDateTime expiredAt ;

    @OneToMany
    List<ParkingSession> parkingSessions ;
}

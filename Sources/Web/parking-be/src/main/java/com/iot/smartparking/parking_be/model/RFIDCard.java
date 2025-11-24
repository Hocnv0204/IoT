package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "card")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RFIDCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Column(unique = true, nullable = false)
    String code; // RFID UID (Mã cứng của thẻ)

    // MONTHLY (Vé tháng) / DAILY (Vé lượt)
    @Column(nullable = false)
    String type;

    // ACTIVE (Đang dùng) / LOCKED (Bị khóa) / LOST (Báo mất)
    String status;

    // Chỉ dùng cho vé tháng
    @Column(name = "issued_at")
    LocalDateTime issuedAt;

    @Column(name = "expired_at")
    LocalDateTime expiredAt;

    @OneToMany(mappedBy = "card")
    List<ParkingSession> parkingSessions;

    // Mẹo: Nếu là thẻ tháng, có thể map ngược lại xem xe nào đang giữ thẻ này
    @OneToOne(mappedBy = "card")
    Vehicle vehicle;
}
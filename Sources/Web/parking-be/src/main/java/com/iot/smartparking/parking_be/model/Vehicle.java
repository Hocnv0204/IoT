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
    Integer id;

    @Column(name = "license_plate", unique = true, nullable = false)
    String licensePlate;

    // CAR / MOTORBIKE
    @Column(nullable = false)
    String type;

    // Màu xe, nhãn hiệu (Optional - giúp bảo vệ nhận diện)
    String brand;
    String color;

    // Quan hệ với chủ xe (Thay vì lưu String ownerName)
    @ManyToOne
    @JoinColumn(name = "customer_id")
    Customer customer;

    // Quan hệ với thẻ (Vé tháng).
    // Nullable = true -> Xe này có thể chưa được cấp thẻ cứng
    @OneToOne
    @JoinColumn(name = "card_id", nullable = true, unique = true)
    RFIDCard card;

    @OneToMany(mappedBy = "vehicle")
    List<ParkingSession> parkingSessions;

    // ACTIVE / INACTIVE (Xe này còn đăng ký trong hệ thống không)
    String status;
}

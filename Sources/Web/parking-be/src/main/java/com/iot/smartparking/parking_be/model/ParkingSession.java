package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "parking_session")
@Getter
@Setter // Dùng Getter/Setter thay Data để tránh lỗi vòng lặp toString với Lazy loading
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    // --- THÔNG TIN VÀO ---
    @Column(name = "time_in", nullable = false)
    LocalDateTime timeIn;

    @Column(name = "image_in")
    String imageIn;

    // Lưu text biển số camera đọc được lúc vào (Để đối chiếu)
    @Column(name = "license_plate_in")
    String licensePlateIn;

    // --- THÔNG TIN RA ---
    @Column(name = "time_out")
    LocalDateTime timeOut;

    @Column(name = "image_out")
    String imageOut;

    @Column(name = "license_plate_out")
    String licensePlateOut;

    // --- TÍNH TOÁN ---
    @Column(name = "fee_calculated")
    Double feeCalculated;

    // Trạng thái phiên: PARKING (Đang đỗ) / COMPLETED (Đã ra)
    String status;

    // --- QUAN HỆ ---

    // Bắt buộc phải có thẻ mới vào được
    @ManyToOne
    @JoinColumn(name = "card_id", nullable = false)
    RFIDCard card;

    // Có thể Null nếu là khách vãng lai (Xe chưa đăng ký trong hệ thống)
    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = true)
    Vehicle vehicle;
}
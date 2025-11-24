package com.iot.smartparking.parking_be.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Table(name = "customer")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Column(name = "full_name", nullable = false)
    String fullName;

    @Column(name = "phone_number")
    String phoneNumber;

    @Column(name = "identity_card") // CCCD/CMND
    String identityCard;

    // Một khách hàng có thể sở hữu nhiều xe
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    List<Vehicle> vehicles;
}

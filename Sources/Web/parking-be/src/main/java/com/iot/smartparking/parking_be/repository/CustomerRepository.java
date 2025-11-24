package com.iot.smartparking.parking_be.repository;

import com.iot.smartparking.parking_be.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByFullName(String fullName);
}


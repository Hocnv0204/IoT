package com.iot.smartparking.parking_be.repository;

import com.iot.smartparking.parking_be.model.RFIDCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<RFIDCard, Integer>{
    boolean existsByCode(String code) ;
    Optional<RFIDCard> findRFIDCardByCode(String code) ;
}

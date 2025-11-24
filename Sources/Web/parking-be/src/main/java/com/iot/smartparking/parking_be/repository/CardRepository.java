package com.iot.smartparking.parking_be.repository;

import com.iot.smartparking.parking_be.model.RFIDCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<RFIDCard, Integer>{
    boolean existsByCode(String code) ;
    Optional<RFIDCard> findRFIDCardByCode(String code) ;
    Page<RFIDCard> findAllByStatus(String status, Pageable pageable);
    Page<RFIDCard> findAllByType(String type, Pageable pageable);
    Page<RFIDCard> findAllByStatusAndType(String status, String type, Pageable pageable);
}

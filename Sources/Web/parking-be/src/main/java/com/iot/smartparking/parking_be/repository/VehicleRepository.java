package com.iot.smartparking.parking_be.repository;

import com.iot.smartparking.parking_be.model.Vehicle;
import com.iot.smartparking.parking_be.utils.PageableUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle , Integer>
{
Optional <Vehicle>findByLicensePlate(String licensePlate) ;
boolean existsByLicensePlate(String licensePlate) ;
Optional<Vehicle> findById(int id) ;
Page<Vehicle> findAll(Pageable pageable ) ;
Optional<Vehicle> findByCardId(int id) ;
long count() ;
}
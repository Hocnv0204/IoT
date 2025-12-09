package com.iot.smartparking.parking_be.repository;

import com.iot.smartparking.parking_be.model.ParkingSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.time.LocalDateTime;
import java.util.Optional;

import com.iot.smartparking.parking_be.dto.MonthlyRevenueDTO; // Add import

public interface ParkingSessionRepository extends JpaRepository<ParkingSession , Integer> {

    @Query("SELECT new com.iot.smartparking.parking_be.dto.MonthlyRevenueDTO(MONTH(p.timeOut), YEAR(p.timeOut), COALESCE(SUM(p.feeCalculated), 0.0)) " +
            "FROM ParkingSession p " +
            "WHERE p.card.type = 'DAILY' AND p.status = 'OUT' " +
            "GROUP BY YEAR(p.timeOut), MONTH(p.timeOut) " +
            "ORDER BY YEAR(p.timeOut) DESC, MONTH(p.timeOut) DESC")
    List<MonthlyRevenueDTO> getMonthlyRevenue();
    @Query("SELECT CASE WHEN COUNT(ps) > 0 THEN true ELSE false END " +
            "FROM ParkingSession ps " +
            "WHERE ps.card.id = :cardId AND ps.status = :status")
    boolean existsParkingSessionByCardAndStatus(@Param("cardId") int cardId, @Param("status") String status);
    
    @Query("SELECT ps FROM ParkingSession ps " +
            "WHERE ps.card.id = :cardId AND ps.status = :status")
    Optional<ParkingSession> findByCardIdAndStatus(@Param("cardId") int cardId, @Param("status") String status);
    @Query("SELECT p FROM ParkingSession p WHERE " +
            "(:vehicleId IS NULL OR p.vehicle.id = :vehicleId) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:fromDate IS NULL OR p.timeIn >= :fromDate) AND " +
            "(:toDate IS NULL OR p.timeIn <= :toDate)")
    Page<ParkingSession> getLogs(
            @Param("vehicleId") Integer vehicleId ,
            @Param("status") String status ,
            @Param("fromDate")LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate , Pageable pageable
            ) ;
    long countByStatus(String status) ;
    long countByTimeInBetween(LocalDateTime start , LocalDateTime end) ;
    long countByTimeOutBetween(LocalDateTime start , LocalDateTime end) ;
}

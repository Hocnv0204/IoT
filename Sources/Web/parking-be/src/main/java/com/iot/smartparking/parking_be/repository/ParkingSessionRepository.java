package com.iot.smartparking.parking_be.repository;

import com.iot.smartparking.parking_be.model.ParkingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParkingSessionRepository extends JpaRepository<ParkingSession , Integer> {
    @Query("SELECT CASE WHEN COUNT(ps) > 0 THEN true ELSE false END " +
            "FROM ParkingSession ps " +
            "WHERE ps.card.id = :cardId AND ps.status = :status")
    boolean existsParkingSessionByCardAndStatus(@Param("cardId") int cardId, @Param("status") String status);

}

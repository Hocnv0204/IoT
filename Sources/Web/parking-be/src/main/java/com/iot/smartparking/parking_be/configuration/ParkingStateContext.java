package com.iot.smartparking.parking_be.configuration;

import org.springframework.stereotype.Component;

@Component
public class ParkingStateContext {
    private volatile String currentStatus = "CHECKIN";

    public String getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(String status) {
        this.currentStatus = status.toUpperCase();
    }
}

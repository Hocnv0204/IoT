package com.iot.smartparking.parking_be.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ESP32MessageDTO {
    private String type; // CHECK_IN hoặc CHECK_OUT
    private String rfid; // Mã thẻ RFID
    
    @JsonProperty("type")
    public String getType() {
        return type;
    }
    
    @JsonProperty("rfid")
    public String getRfid() {
        return rfid;
    }
}


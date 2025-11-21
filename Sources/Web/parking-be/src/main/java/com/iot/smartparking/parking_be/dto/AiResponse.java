package com.iot.smartparking.parking_be.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiResponse {
    @JsonProperty("plate_text")
    private String plateText ;

    @JsonProperty("confidence")
    private Double confidence ;

    @JsonProperty("processing_time_ms")
    private Double processingTimeMs ;
}

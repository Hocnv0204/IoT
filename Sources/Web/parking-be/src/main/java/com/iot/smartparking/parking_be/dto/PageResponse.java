package com.iot.smartparking.parking_be.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PageResponse<T> {
    private List<T> content ;
    private int pageNumber ;
    private int pageSize ;
    private Long totalElements ;
    private boolean last ;
    private int totalPages ;
}

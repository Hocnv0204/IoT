package com.iot.smartparking.parking_be.mapper;

import com.iot.smartparking.parking_be.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

@Component
public class PageMapper {
    public <T> PageResponse<T> toPageResponse(Page<T> page){
        return PageResponse.<T>builder()
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .content(page.getContent())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .last(page.isLast())
                .build()  ;
    }
}

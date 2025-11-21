package com.iot.smartparking.parking_be.utils;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class PageableUtils {
    public static final int DEFAULT_PAGE_SIZE = 10 ;
    public static final int DEFAULT_PAGE_NUMBER = 0 ;

    public static Pageable setPageable(Integer number , Integer size , String order , String sort){
        int pageNumber = (number != null && number >= 0 ) ? number : DEFAULT_PAGE_NUMBER ;
        int pageSize = (size != null && size > 0 ) ? size : DEFAULT_PAGE_SIZE ;
        String sortBy  = (sort != null && sort != "") ? sort : "id" ;
        Sort.Direction orderBy = (order != null && order != "") ? Sort.Direction.fromString(order) : Sort.Direction.ASC ;
        return PageRequest.of(pageNumber , pageSize , orderBy , sortBy) ;

    }
}

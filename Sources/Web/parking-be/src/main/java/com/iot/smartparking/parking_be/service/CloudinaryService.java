package com.iot.smartparking.parking_be.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface CloudinaryService {
    String uploadFile(MultipartFile multipartFile , String folder) throws IOException ;
    void deleteFile(String publicId) throws IOException ;
}

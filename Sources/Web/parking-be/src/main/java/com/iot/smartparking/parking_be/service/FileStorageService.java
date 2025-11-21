package com.iot.smartparking.parking_be.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(MultipartFile file, String subDirectory);
    void deleteFile(String fileName, String subDirectory);
    String getFileUrl(String fileName, String subDirectory);
}

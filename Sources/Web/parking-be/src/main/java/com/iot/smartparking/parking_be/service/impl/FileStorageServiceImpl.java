package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {
    
    @Value("${server.port:8080}")
    private String serverPort;
    
    private static final String IMAGE_FOLDER = "src/main/resources/image";
    private static final String IMAGE_URL_PREFIX = "/api/images/";

    private Path getImageDirectory() {
        // Lấy đường dẫn tuyệt đối đến folder image
        Path imageDir = Paths.get(IMAGE_FOLDER).toAbsolutePath();
        
        // Nếu chạy từ JAR, thử lưu vào folder bên ngoài project
        // Hoặc sử dụng folder hiện tại nếu có quyền ghi
        if (!Files.exists(imageDir.getParent())) {
            // Thử tạo folder trong thư mục hiện tại
            imageDir = Paths.get("image").toAbsolutePath();
        }
        
        return imageDir;
    }

    @Override
    public String storeFile(MultipartFile file, String subDirectory) {
        try {
            // Tạo đường dẫn đến folder image
            Path imageDir = getImageDirectory();
            
            // Tạo folder nếu chưa tồn tại
            if (!Files.exists(imageDir)) {
                Files.createDirectories(imageDir);
                log.info("Created image directory: {}", imageDir.toAbsolutePath());
            }
            
            // Tạo tên file duy nhất
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;
            
            // Lưu file
            Path targetPath = imageDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("File saved successfully: {}", targetPath.toAbsolutePath());
            
            // Trả về URL để truy cập ảnh
            return IMAGE_URL_PREFIX + fileName;
        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileUrl, String subDirectory) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            log.warn("Attempted to delete a file with null or empty URL.");
            return;
        }

        try {
            // Lấy tên file từ URL (ví dụ: /api/images/uuid.jpg -> uuid.jpg)
            String fileName = fileUrl;
            if (fileUrl.contains("/")) {
                fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            }
            
            Path filePath = getImageDirectory().resolve(fileName);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted successfully: {}", filePath.toAbsolutePath());
            } else {
                log.warn("File not found for deletion: {}", filePath.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Failed to delete file: {}", fileUrl, e);
            throw new RuntimeException("Failed to delete file: " + fileUrl, e);
        }
    }

    @Override
    public String getFileUrl(String fileName, String subDirectory) {
        // Nếu fileName đã là URL (chứa /api/images/), trả về luôn
        if (fileName != null && fileName.contains(IMAGE_URL_PREFIX)) {
            return fileName;
        }
        // Nếu chỉ là tên file, build URL
        return IMAGE_URL_PREFIX + fileName;
    }
}

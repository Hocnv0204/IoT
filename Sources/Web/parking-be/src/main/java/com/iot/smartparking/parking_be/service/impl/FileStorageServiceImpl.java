package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
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
    private static final String UPLOAD_DIR = "images";
    private final Path rootLocation;

    public FileStorageServiceImpl() {
        this.rootLocation = Paths.get(UPLOAD_DIR);
        init();
    }

    private void init() {
        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
                log.info("Created upload directory: {}", rootLocation.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String subDirectory) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file");
            }

            // Tạo tên file unique
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;

            // Tạo thư mục con nếu có subDirectory
            Path targetLocation;
            if (subDirectory != null && !subDirectory.isEmpty()) {
                Path subDir = rootLocation.resolve(subDirectory);
                if (!Files.exists(subDir)) {
                    Files.createDirectories(subDir);
                }
                targetLocation = subDir.resolve(fileName);
            } else {
                targetLocation = rootLocation.resolve(fileName);
            }

            // Lưu file
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("File stored successfully: {}", targetLocation.toAbsolutePath());

            // Trả về đường dẫn tương đối để lưu vào DB
            String relativePath = targetLocation.toString().replace("\\", "/");
            return relativePath;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteFile(String filePath, String subDirectory) {
        if (filePath == null || filePath.isEmpty()) {
            log.warn("Attempted to delete a file with null or empty path.");
            return;
        }

        try {
            Path fileToDelete;
            // Nếu filePath là URL (bắt đầu với /images/), lấy phần path
            if (filePath.startsWith("/images/")) {
                fileToDelete = rootLocation.resolve(filePath.substring("/images/".length()));
            } else if (filePath.startsWith("images/")) {
                fileToDelete = rootLocation.resolve(filePath.substring("images/".length()));
            } else {
                // Nếu là relative path từ storeFile
                fileToDelete = Paths.get(filePath);
            }

            if (Files.exists(fileToDelete)) {
                Files.delete(fileToDelete);
                log.info("File deleted successfully: {}", fileToDelete.toAbsolutePath());
            } else {
                log.warn("File not found for deletion: {}", fileToDelete.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + filePath, e);
        }
    }

    @Override
    public String getFileUrl(String fileName, String subDirectory) {
        // fileName đã là relative path từ storeFile (ví dụ: images/iot/uuid.jpg)
        // Trả về URL để frontend có thể truy cập
        if (fileName.startsWith("/")) {
            return fileName;
        }
        return "/" + fileName;
    }
}

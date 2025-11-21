package com.iot.smartparking.parking_be.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.iot.smartparking.parking_be.service.CloudinaryService;
import com.iot.smartparking.parking_be.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {
    private final CloudinaryService cloudinaryService;
    private final Cloudinary cloudinary;

    @Override
    public String storeFile(MultipartFile file, String subDirectory) {
        try {
            return cloudinaryService.uploadFile(file, subDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteFile(String fileUrl, String subDirectory) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            System.out.println("Warning: Attempted to delete a file with null or empty URL.");
            return;
        }

        String publicId;
        try {
            int uploadIndex = fileUrl.indexOf("/upload/");
            if (uploadIndex == -1) {
                throw new IllegalArgumentException("Invalid Cloudinary URL format: missing '/upload/' segment. URL: " + fileUrl);
            }

            String pathSegment = fileUrl.substring(uploadIndex + "/upload/".length());

            if (pathSegment.startsWith("v") && pathSegment.contains("/")) {
                int firstSlashAfterVersion = pathSegment.indexOf('/');
                if (firstSlashAfterVersion != -1) {
                    pathSegment = pathSegment.substring(firstSlashAfterVersion + 1);
                } else {
                    throw new IllegalArgumentException("Invalid Cloudinary URL format: version segment not followed by path in " + fileUrl);
                }
            }

            int lastDotIndex = pathSegment.lastIndexOf(".");
            if (lastDotIndex != -1) {
                publicId = pathSegment.substring(0, lastDotIndex);
            } else {
                publicId = pathSegment;
            }

            if (subDirectory != null && !subDirectory.isEmpty() && !publicId.startsWith(subDirectory + "/")) {
                System.out.println("Warning: Public ID does not match expected subDirectory. Public ID: " + publicId + ", Expected subDirectory: " + subDirectory + ". URL: " + fileUrl);
            }

            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            System.out.println("Cloudinary delete result for publicId: " + publicId + " -> " + result);

        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file from Cloudinary: " + fileUrl, e);
        } catch (Exception e) { // Bắt Exception chung để đảm bảo an toàn với StringIndexOutOfBoundsException và các lỗi parsing khác
            throw new RuntimeException("Error parsing Cloudinary URL or deleting file: " + fileUrl + ". Original Error: " + e.getMessage(), e);
        }
    }

    @Override
    public String getFileUrl(String fileName, String subDirectory) {
        // Cloudinary trả về URL khi upload, bạn nên lưu URL này vào DB và dùng lại
        // Nếu cần build lại URL, bạn có thể tự nối theo cấu trúc Cloudinary
        return  fileName;
    }
}

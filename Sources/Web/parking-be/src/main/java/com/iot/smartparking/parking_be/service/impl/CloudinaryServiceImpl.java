package com.iot.smartparking.parking_be.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.iot.smartparking.parking_be.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary ;
    public CloudinaryServiceImpl(
            @Value("${spring.cloudinary.cloudinary.cloud_name}") String cloudName,
            @Value("${spring.cloudinary.cloudinary.api_key}") String apiKey,
            @Value("${spring.cloudinary.cloudinary.api_secret}") String apiSecret
    ) {
        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        config.put("secure", true);
        this.cloudinary = new Cloudinary(config);
    }
    @Override
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", folder));
        return uploadResult.get("secure_url").toString();
    }

    public void deleteFile(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}

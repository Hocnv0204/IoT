package com.iot.smartparking.parking_be.configuration;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.ObjectUtils;

import java.util.Map;

@Configuration
public class CloudinaryConfig {
    @Value("${spring.cloudinary.cloudinary.cloud_name}")
    private String cloudName;

    @Value("${spring.cloudinary.cloudinary.api_key}")
    private String apiKey;

    @Value("${spring.cloudinary.cloudinary.api_secret}")
    private String apiSecret;



    @Bean // Đánh dấu phương thức này tạo ra một Spring Bean
    public Cloudinary cloudinary() {
        // Tạo một Map chứa thông tin cấu hình Cloudinary
        Map<String, Object> config = Map.of(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true // Nên sử dụng HTTPS
        );
        return new Cloudinary(config);
    }
}

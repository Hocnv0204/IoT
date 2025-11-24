package com.iot.smartparking.parking_be.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình để serve ảnh từ folder image trong resources
        // Thử lấy đường dẫn từ src/main/resources/image trước
        java.nio.file.Path imagePath = java.nio.file.Paths.get("src/main/resources/image").toAbsolutePath();
        
        // Nếu không tồn tại, thử folder image trong thư mục hiện tại
        if (!java.nio.file.Files.exists(imagePath)) {
            imagePath = java.nio.file.Paths.get("image").toAbsolutePath();
        }
        
        String imagePathString = imagePath.toString();
        
        registry.addResourceHandler("/api/images/**")
                .addResourceLocations("file:" + imagePathString + "/");
    }
}


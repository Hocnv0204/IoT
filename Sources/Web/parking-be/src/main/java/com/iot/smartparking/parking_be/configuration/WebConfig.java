package com.iot.smartparking.parking_be.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry){
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173/")
                .allowedMethods("GET" , "POST" , "PUT" , "DELETE" , "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true) ;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình để serve static files từ folder images
        String imagesPath = Paths.get("images").toAbsolutePath().toString();
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + imagesPath + "/");
    }
}

package com.iot.smartparking.parking_be.configuration;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .requestFactory(() -> {
                    // Khởi tạo Factory mặc định của Java
                    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

                    // Cấu hình Timeout tại đây (đơn vị là mili giây - int)
                    factory.setConnectTimeout(3000); // 3 giây (3000ms)
                    factory.setReadTimeout(10000);   // 10 giây (10000ms)

                    return factory;
                })
                .build();
    }
}

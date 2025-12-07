package com.iot.smartparking.parking_be.configuration;

import com.iot.smartparking.parking_be.configuration.handler.ESP32WebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class ESP32WebSocketConfig implements WebSocketConfigurer {
    
    private final ESP32WebSocketHandler esp32WebSocketHandler;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Đăng ký endpoint "/websocket/websocket" cho ESP32-CAM
        // ESP32 kết nối tới: ws://192.168.2.103:8080/websocket/websocket
        registry.addHandler(esp32WebSocketHandler, "/websocket/websocket")
                .setAllowedOrigins("*"); // Cho phép tất cả origins vì ESP32 không có origin header
    }
}



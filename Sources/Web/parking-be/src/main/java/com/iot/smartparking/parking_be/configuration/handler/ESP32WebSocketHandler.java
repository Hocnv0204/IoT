package com.iot.smartparking.parking_be.configuration.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.smartparking.parking_be.dto.request.ESP32MessageDTO;
import com.iot.smartparking.parking_be.dto.response.RFIDNotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class ESP32WebSocketHandler extends TextWebSocketHandler {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Lưu trữ các session đang kết nối từ ESP32
    private final Map<String, WebSocketSession> esp32Sessions = new ConcurrentHashMap<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        esp32Sessions.put(sessionId, session);
        log.info("ESP32-CAM connected: Session ID = {}, Remote Address = {}", 
                 sessionId, session.getRemoteAddress());
        
        // Gửi thông báo xác nhận kết nối
        try {
            session.sendMessage(new TextMessage("{\"status\":\"connected\",\"message\":\"Welcome ESP32-CAM\"}"));
        } catch (IOException e) {
            log.error("Error sending welcome message to ESP32: {}", e.getMessage());
        }
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String sessionId = session.getId();
        String payload = message.getPayload();
        log.info("Received message from ESP32-CAM [{}]: {}", sessionId, payload);
        
        try {
            // Parse JSON message từ ESP32
            ESP32MessageDTO esp32Message = objectMapper.readValue(payload, ESP32MessageDTO.class);
            
            if (esp32Message.getType() == null || esp32Message.getRfid() == null) {
                log.warn("Invalid message format from ESP32: {}", payload);
                sendErrorResponse(session, "Invalid message format. Required: type and rfid");
                return;
            }
            
            // Log thông tin nhận được
            log.info("ESP32 message - Type: {}, RFID: {}", esp32Message.getType(), esp32Message.getRfid());
            
            // Tạo notification DTO để gửi đến frontend
            RFIDNotificationDTO notification = RFIDNotificationDTO.builder()
                    .type(esp32Message.getType())
                    .rfid(esp32Message.getRfid())
                    .timestamp(System.currentTimeMillis())
                    .build();
            
            // Chuyển tiếp message đến frontend qua STOMP topic
            String topic = "/topic/rfid-notification";
            messagingTemplate.convertAndSend(topic, notification);
            log.info("Forwarded RFID notification to frontend via topic: {}", topic);
            
            // Gửi phản hồi xác nhận cho ESP32
            String ackMessage = String.format("{\"status\":\"received\",\"type\":\"%s\",\"rfid\":\"%s\"}", 
                                             esp32Message.getType(), esp32Message.getRfid());
            session.sendMessage(new TextMessage(ackMessage));
            
        } catch (Exception e) {
            log.error("Error processing message from ESP32: {}", e.getMessage(), e);
            sendErrorResponse(session, "Error processing message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        esp32Sessions.remove(sessionId);
        log.info("ESP32-CAM disconnected: Session ID = {}, Close Status = {}", sessionId, status);
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String sessionId = session.getId();
        log.error("Transport error for ESP32-CAM session {}: {}", sessionId, exception.getMessage(), exception);
        esp32Sessions.remove(sessionId);
    }
    
    private void sendErrorResponse(WebSocketSession session, String errorMessage) {
        try {
            String errorJson = String.format("{\"status\":\"error\",\"message\":\"%s\"}", errorMessage);
            session.sendMessage(new TextMessage(errorJson));
        } catch (IOException e) {
            log.error("Error sending error response to ESP32: {}", e.getMessage());
        }
    }


    // Phương thức để lấy số lượng ESP32 đang kết nối (có thể dùng cho monitoring)
    public int getConnectedESP32Count() {
        return esp32Sessions.size();
    }
}



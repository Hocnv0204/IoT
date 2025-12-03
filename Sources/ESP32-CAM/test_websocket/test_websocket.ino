#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <MFRC522.h>
#include <SPI.h>
#include "soc/soc.h"           // Thư viện để tắt Brownout
#include "soc/rtc_cntl_reg.h"  // Thư viện để tắt Brownout

// ================= CẤU HÌNH WIFI =================
const char* ssid = "Nerdbox 2.4G";
const char* password = "1234567890";

// ================= CẤU HÌNH SERVER =================
WebSocketsServer webSocket = WebSocketsServer(81); // Port 81

// ================= CẤU HÌNH RC522 =================
// Định nghĩa chân SPI cho ESP32-CAM
#define RST_PIN  2
#define SS_PIN   15
#define MOSI_PIN 13
#define MISO_PIN 12
#define SCK_PIN  14

MFRC522 *mfrc522 = NULL; // Con trỏ tới đối tượng RC522

// ================= CẤU HÌNH CAMERA (AI THINKER) =================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

unsigned long lastCameraCapture = 0;
const int cameraInterval = 100; // 100ms = 10 FPS (Tăng lên nếu mạng lag)

// ================= XỬ LÝ WEBSOCKET =================
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            break;
        case WStype_CONNECTED:
            {
                IPAddress ip = webSocket.remoteIP(num);
                Serial.printf("[%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
            }
            break;
    }
}
void checkRC522SPI() {
    Serial.println("[RFID SPI Test] Checking SPI connection with RC522...");

    // Ép kiểu int sang MFRC522::PCD_Register
    MFRC522::PCD_Register versionRegAddr = static_cast<MFRC522::PCD_Register>(0x37);
    uint8_t versionReg = mfrc522->PCD_ReadRegister(versionRegAddr);

    Serial.print("[RFID SPI Test] VersionReg (0x37) = 0x");
    Serial.println(versionReg, HEX);

    if (versionReg == 0x92 || versionReg == 0x91 || versionReg == 0x90) {
        Serial.println("[RFID SPI Test] RC522 SPI OK!");
    } else {
        Serial.println("[RFID SPI Test] RC522 SPI FAIL! Check wiring.");
    }
}



void setup() {
    // Tắt Brownout detector để tránh reset khi sụt áp do Camera + Wifi
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
    
    Serial.begin(115200);

    // 1. Kết nối WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi Connected!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP()); // <--- COPY IP NÀY CHO FRONTEND

    // 2. Khởi tạo Camera
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;
    
    // Cấu hình chất lượng ảnh
    if(psramFound()){
        config.frame_size = FRAMESIZE_QVGA; // 320x240
        config.jpeg_quality = 12; // 10-63 (thấp là đẹp nhưng nặng)
        config.fb_count = 2;
    } else {
        config.frame_size = FRAMESIZE_QVGA;
        config.jpeg_quality = 12;
        config.fb_count = 1;
    }

    if (esp_camera_init(&config) != ESP_OK) {
        Serial.println("Camera Init Failed");
        return;
    }

    // 3. Khởi tạo RFID (SỬA LỖI BIÊN DỊCH Ở ĐÂY)
    // Cấu hình chân SPI toàn cục
    SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
    
    // Khởi tạo đối tượng MFRC522 (chỉ truyền SS và RST, thư viện tự lấy SPI toàn cục)
    mfrc522 = new MFRC522(SS_PIN, RST_PIN); 
    mfrc522->PCD_Init();
    
    // Kiểm tra xem chip có nhận không
    Serial.print("RFID Version: ");
    mfrc522->PCD_DumpVersionToSerial(); 
    Serial.println("RFID Ready!");
checkRC522SPI();
    // 4. Khởi động WebSocket
    webSocket.begin();
    webSocket.onEvent(onWebSocketEvent);
    Serial.println("WebSocket Server Started at port 81");
}

void loop() {
    webSocket.loop();

    // --- PHẦN 1: Kiểm tra thẻ RFID ---
    if (mfrc522->PICC_IsNewCardPresent()) {
        Serial.println("[RFID] New card detected!");
        if (mfrc522->PICC_ReadCardSerial()) {
            String rfid = "";
            for (byte i = 0; i < mfrc522->uid.size; i++) {
                rfid += String(mfrc522->uid.uidByte[i], HEX);
            }
            rfid.toUpperCase();
            Serial.println("[RFID] Card UID: " + rfid);

            // Gửi JSON qua WebSocket
            String json = "{\"type\":\"CHECK_IN\", \"rfid\":\"" + rfid + "\"}";
            webSocket.broadcastTXT(json);
            Serial.println("[WebSocket] Sent: " + json);

            // Dừng đọc thẻ hiện tại
            mfrc522->PICC_HaltA();
            mfrc522->PCD_StopCrypto1();
        } else {
            Serial.println("[RFID] Failed to read card serial");
        }
    } else {
        // Uncomment nếu muốn log liên tục để kiểm tra cảm biến
        // Serial.println("[RFID] No new card present");
    }

    // --- PHẦN 2: Gửi Video Stream ---
    unsigned long now = millis();
    if (now - lastCameraCapture > cameraInterval) {
        lastCameraCapture = now;
        
        int clients = webSocket.connectedClients();

        if(clients > 0) {
            camera_fb_t * fb = esp_camera_fb_get();
            if (!fb) {
                Serial.println("[Camera] Capture failed");
                return;
            }

            webSocket.broadcastBIN(fb->buf, fb->len);

            esp_camera_fb_return(fb);
        }
    }
}

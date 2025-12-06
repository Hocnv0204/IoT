// FULL CODE: ESP32-CAM (AI-Thinker) + RFID RC522 + HC-SR04 + Servo + WebSocket stream
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <SPI.h>
#include <MFRC522.h>
#include "esp_camera.h"
#include <ESP32Servo.h>
#include "soc/rtc_cntl_reg.h" // để tắt brownout nếu cần

// ================= WIFI =================
const char* ssid = "Nerdbox 2.4G";
const char* password = "1234567890";

// ================= WEBSOCKET =================
WebSocketsServer webSocket(81);

// ================= RFID (SPI) =================
// SPI pins (ESP32-CAM AI-Thinker)
#define SCK_PIN   14
#define MISO_PIN  12
#define MOSI_PIN  13
#define SS_PIN    15
#define RST_PIN   2

MFRC522 rfid(SS_PIN, RST_PIN);

// ================= CAMERA (AI-Thinker) =================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM       5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ================= SERVO =================
// Chọn chân an toàn, không trùng camera/SPI/boot
#define SERVO_PIN 17
Servo gate;
bool gateOpen = false;
unsigned long gateTimer = 0;
const unsigned long gateOpenDuration = 5000; // ms

#define FLASH_LED_PIN 4

// ================= HC-SR04 =================
// Không dùng ECHO = 0 (GPIO0) — tránh xung với camera
#define TRIG_PIN 16
#define ECHO_PIN 33
int closeDistance = 10; // cm

// ================= STREAM =================
unsigned long lastStreamTime = 0;
const int streamRate = 100; // ms (10 FPS maximum, adjust)

// ================= BROWNOUT (tùy chọn) =================
// Nếu bạn chắc chắn cấp nguồn ổn định 5V -> có thể tắt brownout để tránh reset không mong muốn
// Nếu không chắc, COMMENT dòng WRITE_PERI_REG bên dưới
void disableBrownout() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
}

// ================= HÀM ĐO KHOẢNG CÁCH =================
long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // timeout 25ms -> ~4.2m
  long duration = pulseIn(ECHO_PIN, HIGH, 25000);
  if (duration == 0) return -1;
  return duration / 58;
}

void disableFlashLED() {
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW); // giữ đèn tắt hoàn toàn
}


// ================= WEBSOCKET EVENT =================
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected\n", num);
      break;
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      break;
    }
    case WStype_TEXT: {
      String msg = String((char*)payload);
      Serial.printf("[%u] TXT: %s\n", num, msg.c_str());

      // Simple commands from frontend/backend
      if (msg == "OPEN_GATE") {
        gate.write(90);
        gateOpen = true;
        gateTimer = millis();
        // thông báo lại trạng thái
        webSocket.broadcastTXT("{\"type\":\"RESPONSE\",\"action\":\"OPEN_GATE\",\"status\":\"OK\"}");
      } else if (msg == "STATUS") {
        long d = getDistance();
        String s = String("{\"type\":\"STATUS\",\"distance\":") + String(d) + ",\"gateOpen\":" + (gateOpen ? "true" : "false") + "}";
        webSocket.sendTXT(num, s);
      }
      break;
    }
    default:
      break;
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(100);

  // Nếu muốn tắt brownout (chỉ tắt khi nguồn tốt)
  // disableBrownout();

  Serial.println("Starting...");

  // WiFi connect
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
    // nếu quá lâu, break để tránh treo
    if (millis() - wifiStart > 20000) break;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi not connected - continue anyway");
  }

  // ==== Camera config ====
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
  config.xclk_freq_hz = 20000000; // 20MHz
  config.pixel_format = PIXFORMAT_JPEG;

  // Nếu có PSRAM -> dùng frame lớn hơn & fb_count =2
  if (psramFound()) {
    config.frame_size = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 12;
    config.fb_count = 2;
    config.fb_location = CAMERA_FB_IN_PSRAM;
  } else {
    config.frame_size = FRAMESIZE_QQVGA; // 160x120 nếu không có PSRAM
    config.jpeg_quality = 20;
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM;
  }
  config.grab_mode = CAMERA_GRAB_LATEST;

  // init camera với kiểm tra lỗi
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    // Không return để vẫn tiếp tục các chức năng khác (RFID, WebSocket) — tùy bạn
  } else {
    Serial.println("Camera init OK");
  }

  // ==== SPI + RFID init ====
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  Serial.println("RFID init done");

  // ==== Servo init ====
  gate.attach(SERVO_PIN);
  gate.write(0); // đóng

  // ==== HC-SR04 init ====
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // ==== WebSocket init ====
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
  Serial.println("WebSocket server started on port 81");
}

// ================= LOOP =================
void loop() {
  webSocket.loop();
    disableFlashLED();

  // Đo khoảng cách (mỗi vòng)
  long distance = getDistance();

  // Tự đóng cổng khi vượt quá thời gian
  if (gateOpen && millis() - gateTimer >= gateOpenDuration) {
    gate.write(0);
    gateOpen = false;
    Serial.println("Gate closed (timeout)");
    // broadcast trạng thái
    String s = String("{\"type\":\"STATUS\",\"distance\":") + String(distance) + ",\"gateOpen\":false}";
    webSocket.broadcastTXT(s);
  }

  // RFID check (nếu cổng đóng)
  if (!gateOpen) {
    if (rfid.PICC_IsNewCardPresent()) {
      if (rfid.PICC_ReadCardSerial()) {
        String uid = "";
        for (byte i = 0; i < rfid.uid.size; i++) {
          if (rfid.uid.uidByte[i] < 0x10) uid += "0";
          uid += String(rfid.uid.uidByte[i], HEX);
        }
        uid.toUpperCase();
        Serial.println("RFID UID: " + uid);

        // gửi event qua WebSocket
        String j = "{\"type\":\"RFID\",\"uid\":\"" + uid + "\"}";
        webSocket.broadcastTXT(j);

        // dừng đọc thẻ hiện tại
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
      } else {
        // không đọc được serial
      }
    }
  }

  // Gửi stream và status theo interval
  if (millis() - lastStreamTime >= streamRate) {
    lastStreamTime = millis();

    // gửi ảnh (nếu camera init thành công)
    camera_fb_t * fb = esp_camera_fb_get();
    if (fb) {
      // Broadcast binary to all clients (frontend phải xử lý Blob)
      webSocket.broadcastBIN(fb->buf, fb->len);
      esp_camera_fb_return(fb);
    }

    // Gửi trạng thái JSON
    String statusJson = String("{\"type\":\"STATUS\",\"distance\":") + String(distance) +
                        ",\"gateOpen\":" + (gateOpen ? "true" : "false") + "}";
    webSocket.broadcastTXT(statusJson);
  }

  delay(10);
}

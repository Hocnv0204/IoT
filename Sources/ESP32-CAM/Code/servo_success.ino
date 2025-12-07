#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <MFRC522.h>
#include <SPI.h>
#include <HTTPClient.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <ESP32Servo.h>
#include <ArduinoJson.h> // thư viện ArduinoJson để parse JSON

// ================= WIFI =================
const char* ssid = "Thanhhuyen";
const char* password = "10102017";

// ================= SERVER =================
const char* serverUrl = "http://192.168.2.103:8080/api/parking-session/scan";

// ================= RC522 =================
#define SS_PIN 2
#define RST_PIN 4
MFRC522 *mfrc522 = NULL;

// ================= CAMERA (AI THINKER) =================
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

// ================= SERVO =================
#define SERVO_PIN 15
Servo barrierServo;

// ================= VARIABLES =================
WebSocketsServer webSocket = WebSocketsServer(81);
bool isSending = false;
bool streamEnabled = true;
unsigned long lastReadUIDTime = 0;
unsigned long lastCameraCapture = 0;
const int cameraInterval = 300; // ms, tăng để giảm tải

// ================= CAMERA CONFIG (global) =================
camera_config_t cameraConfig;

// =========== HELPERS CAMERA ===========
void fillCameraConfig(framesize_t streamSize, int streamQuality) {
  cameraConfig.ledc_channel = LEDC_CHANNEL_0;
  cameraConfig.ledc_timer = LEDC_TIMER_0;
  cameraConfig.pin_d0 = Y2_GPIO_NUM;
  cameraConfig.pin_d1 = Y3_GPIO_NUM;
  cameraConfig.pin_d2 = Y4_GPIO_NUM;
  cameraConfig.pin_d3 = Y5_GPIO_NUM;
  cameraConfig.pin_d4 = Y6_GPIO_NUM;
  cameraConfig.pin_d5 = Y7_GPIO_NUM;
  cameraConfig.pin_d6 = Y8_GPIO_NUM;
  cameraConfig.pin_d7 = Y9_GPIO_NUM;
  cameraConfig.pin_xclk = XCLK_GPIO_NUM;
  cameraConfig.pin_pclk = PCLK_GPIO_NUM;
  cameraConfig.pin_vsync = VSYNC_GPIO_NUM;
  cameraConfig.pin_href = HREF_GPIO_NUM;
  cameraConfig.pin_sscb_sda = SIOD_GPIO_NUM;
  cameraConfig.pin_sscb_scl = SIOC_GPIO_NUM;
  cameraConfig.pin_pwdn = PWDN_GPIO_NUM;
  cameraConfig.pin_reset = RESET_GPIO_NUM;
  cameraConfig.xclk_freq_hz = 20000000;
  cameraConfig.pixel_format = PIXFORMAT_JPEG;
  cameraConfig.frame_size = streamSize;
  cameraConfig.jpeg_quality = streamQuality;
  cameraConfig.fb_count = psramFound() ? 2 : 1;
}

// Khởi tạo camera 1 lần (dùng lúc setup)
bool initCameraOnce(framesize_t streamSize = FRAMESIZE_QQVGA, int streamQuality = 30) {
  fillCameraConfig(streamSize, streamQuality);
  esp_err_t err = esp_camera_init(&cameraConfig);
  if (err != ESP_OK) {
    Serial.printf("[CAM] Init failed: 0x%x\n", err);
    return false;
  }
  Serial.println("[CAM] Init OK");
  return true;
}

// Re-init camera (dùng để chuyển độ phân giải khi chụp / phục hồi)
bool reinitCamera(framesize_t streamSize, int streamQuality) {
  fillCameraConfig(streamSize, streamQuality);
  esp_camera_deinit();
  esp_err_t err = esp_camera_init(&cameraConfig);
  if (err != ESP_OK) {
    Serial.printf("[CAM] Reinit failed: 0x%x\n", err);
    return false;
  }
  return true;
}

// =========== HÀM DỪNG / BẬT STREAM ===========
void startStream() { streamEnabled = true; }
void stopStream()  { streamEnabled = false; }

// =========== HỖ TRỢ THAY ĐỔI KHUNG HÌNH AN TOÀN ===========
void setCameraFrameSize(framesize_t size, int quality) {
  sensor_t * s = esp_camera_sensor_get();
  if (!s) return;
  s->set_framesize(s, size);
  if (s->set_quality) s->set_quality(s, quality);
  delay(100);
}

// =========== SEND IMAGE + RFID (the new logic) ===========
void sendHttpWithImage(String rfid) {
  if (isSending) return;
  isSending = true;

  stopStream();

  Serial.println("[SEND] Preparing capture...");

  framesize_t captureSize = psramFound() ? FRAMESIZE_VGA : FRAMESIZE_QVGA;
  int captureQuality = 20;
  if (!reinitCamera(captureSize, captureQuality)) {
    Serial.println("[CAM] Camera reinit for capture failed");
    reinitCamera(FRAMESIZE_QQVGA, 30);
    startStream();
    isSending = false;
    return;
  }

  delay(150);

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb || !fb->buf) {
    Serial.println("[CAM] Capture failed!");
    if (fb) esp_camera_fb_return(fb);
    reinitCamera(FRAMESIZE_QQVGA, 30);
    startStream();
    isSending = false;
    return;
  }

  Serial.printf("[CAM] Captured image size: %u bytes\n", fb->len);

  String boundary = "ESP32BOUNDARY";
  String head = "--" + boundary + "\r\n"
                "Content-Disposition: form-data; name=\"rfid\"\r\n\r\n" +
                rfid + "\r\n" +
                "--" + boundary + "\r\n"
                "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n"
                "Content-Type: image/jpeg\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";

  int headLen = head.length();
  int tailLen = tail.length();
  int totalLen = headLen + fb->len + tailLen;

  Serial.printf("[HTTP] Preparing buffer, totalLen=%d\n", totalLen);

  uint8_t *buffer = nullptr;
  try {
    buffer = new uint8_t[totalLen];
  } catch(...) {
    Serial.println("[HTTP] Memory alloc failed");
    esp_camera_fb_return(fb);
    reinitCamera(FRAMESIZE_QQVGA, 30);
    startStream();
    isSending = false;
    return;
  }

  memcpy(buffer, head.c_str(), headLen);
  memcpy(buffer + headLen, fb->buf, fb->len);
  memcpy(buffer + headLen + fb->len, tail.c_str(), tailLen);

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

  int httpCode = http.POST(buffer, totalLen);
  if (httpCode > 0) {
    Serial.printf("[HTTP] Response code: %d\n", httpCode);
    String payload = http.getString();
    Serial.println("[HTTP] Response payload:");
    Serial.println(payload);

    // ====== BỔ SUNG KIỂM TRA STATUS & ĐIỀU KHIỂN SERVO ======
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      const char* status = doc["data"]["status"];
      if (status && strcmp(status, "OPEN") == 0) {
        Serial.println("[SERVO] OPEN detected, rotating servo");
        barrierServo.write(90); // mở barrier
        delay(10000);           // giữ 10 giây
        barrierServo.write(0);  // đóng barrier
        Serial.println("[SERVO] Barrier closed");
      } else {
        Serial.println("[SERVO] Status not OPEN, servo not activated");
      }
    } else {
      Serial.println("[JSON] Parse error");
    }
  } else {
    Serial.printf("[HTTP] POST failed, error: %d\n", httpCode);
  }

  delete[] buffer;
  esp_camera_fb_return(fb);
  http.end();

  if (!reinitCamera(FRAMESIZE_QQVGA, 30)) {
    Serial.println("[CAM] Failed to reinit stream camera");
  }
  startStream();

  isSending = false;
  Serial.println("[SEND] Done");
}

// =========== WEBSOCKET EVENT ===========
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t len) {
  if (type == WStype_CONNECTED)
    Serial.printf("[WS] Client %u connected\n", num);
  else if (type == WStype_DISCONNECTED)
    Serial.printf("[WS] Client %u disconnected\n", num);
}

// =========== SETUP ===========
void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  pinMode(33, OUTPUT);
  digitalWrite(33, HIGH);

  WiFi.begin(ssid, password);
  Serial.print("WiFi Connecting");
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(200);
    if (millis() - wifiStart > 20000) break;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected!");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi not connected");
  }

  if (!initCameraOnce(FRAMESIZE_QQVGA, 30)) {
    Serial.println("Camera init failed, halting...");
    while (true) delay(1000);
  }

  SPI.begin(14, 12, 13, SS_PIN);
  mfrc522 = new MFRC522(SS_PIN, RST_PIN);
  mfrc522->PCD_Init();

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  // Khởi tạo servo
  barrierServo.attach(SERVO_PIN);
  barrierServo.write(0); // ban đầu đóng

  Serial.println("SYSTEM READY!");
}

// =========== LOOP ===========
void loop() {
  webSocket.loop();

  if (streamEnabled && webSocket.connectedClients() > 0 && millis() - lastCameraCapture > cameraInterval) {
    lastCameraCapture = millis();
    camera_fb_t * fb = esp_camera_fb_get();
    if (fb) {
      webSocket.broadcastBIN(fb->buf, fb->len);
      esp_camera_fb_return(fb);
    }
  }

  if (!isSending &&
      mfrc522->PICC_IsNewCardPresent() &&
      mfrc522->PICC_ReadCardSerial()) {

    if (millis() - lastReadUIDTime > 2000) {
      String uid = "";
      for (byte i = 0; i < mfrc522->uid.size; i++) {
        if (mfrc522->uid.uidByte[i] < 0x10) uid += "0";
        uid += String(mfrc522->uid.uidByte[i], HEX);
      }
      uid.toUpperCase();
      Serial.println("[RFID] UID: " + uid);
      webSocket.broadcastTXT(uid);

      sendHttpWithImage(uid);
      lastReadUIDTime = millis();
    }

    mfrc522->PICC_HaltA();
    mfrc522->PCD_StopCrypto1();
  }

  delay(5);
}

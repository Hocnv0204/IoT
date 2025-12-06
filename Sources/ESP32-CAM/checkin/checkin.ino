#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <MFRC522.h>
#include <SPI.h>
#include <HTTPClient.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ================= WIFI =================
const char* ssid = "Thanhhuyen";
const char* password = "10102017";

// ================= SERVER =================
const char* serverUrl = "http://192.168.2.103:8080/api/parking-session/checkin";

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

// ================= VARIABLES =================
WebSocketsServer webSocket = WebSocketsServer(81);
bool isSending = false;
unsigned long lastReadUIDTime = 0;
unsigned long lastCameraCapture = 0;
const int cameraInterval = 100;

// ================= CAMERA CONFIG =================
camera_config_t cameraConfig;  // lưu config chung

// ================= SETUP CAMERA =================
void setupCamera(framesize_t frameSize, int jpegQuality) {
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
  cameraConfig.frame_size = frameSize;
  cameraConfig.jpeg_quality = jpegQuality;
  cameraConfig.fb_count = psramFound() ? 2 : 1;

  esp_camera_deinit();
  if (esp_camera_init(&cameraConfig) != ESP_OK) {
    Serial.println("[CAM] Camera init failed!");
  }
}

// ================= FUNCTION: SEND IMAGE + RFID =================
void sendHttpWithImage(String rfid) {
  if (isSending) return;  
  isSending = true;

  // Chụp ảnh nét (VGA)
  setupCamera(FRAMESIZE_VGA, 20);
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb || !fb->buf) {
    Serial.println("[CAM] Failed to capture high-res image");
    isSending = false;
    // Quay về stream
    setupCamera(FRAMESIZE_QQVGA, 10);
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  String boundary = "ESP32BOUNDARY";
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

  String head = "--" + boundary + "\r\n"
                "Content-Disposition: form-data; name=\"rfid\"\r\n\r\n" +
                rfid + "\r\n" +
                "--" + boundary + "\r\n"
                "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n"
                "Content-Type: image/jpeg\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";

  int totalLen = head.length() + fb->len + tail.length();
  uint8_t *buffer = new uint8_t[totalLen];

  memcpy(buffer, head.c_str(), head.length());
  memcpy(buffer + head.length(), fb->buf, fb->len);
  memcpy(buffer + head.length() + fb->len, tail.c_str(), tail.length());

  int httpCode = http.POST(buffer, totalLen);
  delete[] buffer;

  if (httpCode > 0) {
    Serial.printf("[HTTP] Response: %d\n", httpCode);
    String resp = http.getString();
    Serial.println(resp);
  } else {
    Serial.println("[HTTP] POST failed");
  }

  esp_camera_fb_return(fb);
  http.end();

  // Quay về stream video nhẹ
  setupCamera(FRAMESIZE_QQVGA, 10);
  isSending = false;
}

// ================= WEBSOCKET EVENT =================
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t len) {
  if (type == WStype_CONNECTED)
    Serial.printf("[WS] Client %u connected\n", num);
  else if (type == WStype_DISCONNECTED)
    Serial.printf("[WS] Client %u disconnected\n", num);
}

// ================= SETUP =================
void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200);
  pinMode(33, OUTPUT);
  digitalWrite(33, HIGH);

  // ================= WIFI =================
  WiFi.begin(ssid, password);
  Serial.print("WiFi Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(200);
  }
  Serial.println("\nWiFi Connected!");
  Serial.println(WiFi.localIP());

  // ================= CAMERA =================
  setupCamera(FRAMESIZE_QQVGA, 10);  // stream video nhẹ

  // ================= RC522 =================
  SPI.begin(14, 12, 13, SS_PIN);
  mfrc522 = new MFRC522(SS_PIN, RST_PIN);
  mfrc522->PCD_Init();

  // ================= WEBSOCKET =================
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  Serial.println("SYSTEM READY!");
}

// ================= LOOP =================
void loop() {
  webSocket.loop();

  // Stream video nhẹ
  if (webSocket.connectedClients() > 0 && millis() - lastCameraCapture > cameraInterval) {
    lastCameraCapture = millis();
    camera_fb_t *fb = esp_camera_fb_get();
    if (fb) {
      webSocket.broadcastBIN(fb->buf, fb->len);
      esp_camera_fb_return(fb);
    }
  }

  // Quẹt thẻ RFID
  if (!isSending &&
      mfrc522->PICC_IsNewCardPresent() &&
      mfrc522->PICC_ReadCardSerial()) {

    if (millis() - lastReadUIDTime > 2000) {  // chống quét liên tục
      String uid = "";
      for (byte i = 0; i < mfrc522->uid.size; i++)
        uid += String(mfrc522->uid.uidByte[i], HEX);
      uid.toUpperCase();
      Serial.println("[RFID] UID: " + uid);

      sendHttpWithImage(uid);
      lastReadUIDTime = millis();
    }

    mfrc522->PICC_HaltA();
    mfrc522->PCD_StopCrypto1();
  }

  delay(5); // tránh reset Watchdog
}

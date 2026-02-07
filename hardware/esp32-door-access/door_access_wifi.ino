// ============================================================
// RECONNECT ACADEMY - DOOR ACCESS SYSTEM (WiFi Enabled)
// ============================================================
// Hardware: TTGO T-Display V1.1 (ESP32) + Wiegand QR Scanner
// Date: January 2026
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============ WIFI CREDENTIALS ============
const char* WIFI_SSID = "Msd";
const char* WIFI_PASSWORD = "MMAalst0924!";

// ============ API CONFIG ============
const char* API_URL = "https://wiuzjpoizxeycrshsuqn.supabase.co/functions/v1/door-validate";
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdXpqcG9penhleWNyc2hzdXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNjAwMzcsImV4cCI6MjA0ODYzNjAzN30.uCMejZLNTLd4E-yQMtvW8hOydEOJmNFPCrOtbZPQGU0";

// ============ PIN CONFIG ============
#define D0_PIN 25      // Wiegand Data 0 (Green wire)
#define D1_PIN 26      // Wiegand Data 1 (White wire)
#define RELAY_PIN 27   // Relay control
#define DOOR_OPEN_TIME 5000  // 5 seconds

// ============ WIEGAND DECODER ============
volatile unsigned long cardCode = 0;
volatile int bitCount = 0;
volatile unsigned long lastBitTime = 0;

// Buffer for long QR data (JWT tokens)
// JWT tokens are ~200+ characters, each character = 8 bits via Wiegand
volatile uint8_t bitBuffer[2048];  // Buffer for up to 2048 bits
volatile int currentBit = 0;

void IRAM_ATTR d0_ISR() {
  unsigned long now = millis();
  if (now - lastBitTime > 50) {
    // Reset on new transmission
    cardCode = 0;
    bitCount = 0;
    currentBit = 0;
  }

  // Store bit in buffer
  if (currentBit < 2048) {
    int byteIndex = currentBit / 8;
    int bitIndex = 7 - (currentBit % 8);  // MSB first
    bitBuffer[byteIndex] &= ~(1 << bitIndex);  // Set bit to 0
    currentBit++;
  }

  // Also update cardCode for 26-bit card compatibility
  cardCode <<= 1;
  bitCount++;
  lastBitTime = now;
}

void IRAM_ATTR d1_ISR() {
  unsigned long now = millis();
  if (now - lastBitTime > 50) {
    // Reset on new transmission
    cardCode = 0;
    bitCount = 0;
    currentBit = 0;
  }

  // Store bit in buffer
  if (currentBit < 2048) {
    int byteIndex = currentBit / 8;
    int bitIndex = 7 - (currentBit % 8);  // MSB first
    bitBuffer[byteIndex] |= (1 << bitIndex);  // Set bit to 1
    currentBit++;
  }

  // Also update cardCode for 26-bit card compatibility
  cardCode <<= 1;
  cardCode |= 1;
  bitCount++;
  lastBitTime = now;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("========================================");
  Serial.println("  RECONNECT ACADEMY - DOOR ACCESS");
  Serial.println("========================================");
  Serial.println();

  // Setup relay pin
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("[OK] Relay pin configured");

  // Setup Wiegand pins
  pinMode(D0_PIN, INPUT_PULLUP);
  pinMode(D1_PIN, INPUT_PULLUP);
  Serial.println("[OK] Wiegand pins configured");

  // Connect to WiFi
  connectWiFi();

  // Attach interrupts for Wiegand
  attachInterrupt(digitalPinToInterrupt(D0_PIN), d0_ISR, FALLING);
  attachInterrupt(digitalPinToInterrupt(D1_PIN), d1_ISR, FALLING);

  Serial.println();
  Serial.println(">>> READY - Scan QR code to enter <<<");
  Serial.println();
}

void connectWiFi() {
  Serial.print("[WIFI] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WIFI] Connected!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("[WIFI] CONNECTION FAILED!");
    Serial.println("[WIFI] Will retry in background...");
  }
}

void ensureWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(250);
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("[WIFI] Reconnected!");
    }
  }
}

// Validate QR code via API
bool validateQR(String qrCode) {
  ensureWiFi();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[API] No WiFi - ACCESS DENIED");
    return false;
  }

  Serial.println("[API] Validating QR code...");

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);  // Required by door-validate Edge Function
  http.setTimeout(5000);

  // Build JSON payload
  StaticJsonDocument<1024> doc;
  doc["qr"] = qrCode;
  String payload;
  serializeJson(doc, payload);

  Serial.print("[API] Request: ");
  Serial.println(payload.substring(0, 50) + "...");

  int httpCode = http.POST(payload);

  bool allowed = false;
  String reason = "";

  if (httpCode == 200) {
    String response = http.getString();
    Serial.print("[API] Response: ");
    Serial.println(response);

    StaticJsonDocument<512> resDoc;
    DeserializationError error = deserializeJson(resDoc, response);

    if (!error) {
      allowed = resDoc["allowed"] | false;
      const char* memberName = resDoc["member_name"] | "";
      reason = resDoc["reason"] | "";

      if (allowed && strlen(memberName) > 0) {
        Serial.println();
        Serial.println("================================");
        Serial.print("  WELCOME ");
        Serial.println(memberName);
        Serial.println("================================");
        Serial.println();
      } else {
        Serial.println();
        Serial.println("!!! ACCESS DENIED !!!");
        if (reason.length() > 0) {
          Serial.print("Reason: ");
          Serial.println(reason);
        }
        Serial.println();
      }
    } else {
      Serial.println("[API] JSON Parse Error");
    }
  } else {
    Serial.print("[API] HTTP Error: ");
    Serial.println(httpCode);
    if (httpCode > 0) {
      String response = http.getString();
      Serial.print("[API] Error response: ");
      Serial.println(response);
    }
  }

  http.end();
  return allowed;
}

void openDoor() {
  Serial.println();
  Serial.println(">>> DOOR OPENING <<<");
  digitalWrite(RELAY_PIN, HIGH);
  delay(DOOR_OPEN_TIME);
  digitalWrite(RELAY_PIN, LOW);
  Serial.println(">>> DOOR CLOSED <<<");
  Serial.println();
}

void denyAccess(String reason) {
  Serial.println();
  Serial.println("!!! ACCESS DENIED !!!");
  if (reason.length() > 0) {
    Serial.print("Reason: ");
    Serial.println(reason);
  }
  Serial.println();
  // TODO: Add red LED flash or buzzer sound for feedback
}

void loop() {
  // Check for completed Wiegand transmission
  if (bitCount > 0 && (millis() - lastBitTime > 100)) {

    Serial.println();
    Serial.println("********** SCAN RECEIVED **********");
    Serial.print("Bits received: ");
    Serial.println(bitCount);

    String qrCode = "";

    // ===========================================
    // DATA TYPE DETECTION
    // ===========================================

    if (bitCount == 26) {
      // Standard 26-bit Wiegand card
      Serial.println("[TYPE] 26-bit Wiegand Card");
      Serial.print("[DATA] Card code: ");
      Serial.println(cardCode);
      qrCode = String(cardCode);

    } else if (bitCount > 30) {
      // Long data = QR code content (alphanumeric)
      // Reconstruct ASCII string from bit buffer
      Serial.println("[TYPE] QR Code Data");
      Serial.print("[DATA] Reconstructing from ");
      Serial.print(bitCount);
      Serial.println(" bits...");

      int numBytes = (bitCount + 7) / 8;  // Round up
      char reconstructed[512];
      int charIndex = 0;

      for (int i = 0; i < numBytes && charIndex < 511; i++) {
        char c = (char)bitBuffer[i];
        // Only add printable ASCII characters (JWT tokens are base64 + dots)
        if (c >= 32 && c <= 126) {
          reconstructed[charIndex++] = c;
        }
      }
      reconstructed[charIndex] = '\0';

      qrCode = String(reconstructed);
      Serial.print("[DATA] JWT Token: ");
      Serial.println(qrCode.substring(0, 50) + "...");

    } else {
      // Unknown format
      Serial.println("[TYPE] Unknown format");
      Serial.print("[DATA] Bits: ");
      Serial.print(bitCount);
      Serial.print(", Raw code: ");
      Serial.println(cardCode);
      qrCode = String(cardCode);  // Fallback to numeric
    }

    // ===========================================
    // PRODUCTION MODE: Validate via API
    // ===========================================

    if (qrCode.length() > 0) {
      Serial.println();
      Serial.println("[VALIDATION] Calling door-validate API...");

      if (validateQR(qrCode)) {
        openDoor();
      } else {
        denyAccess("");
      }
    } else {
      Serial.println("[ERROR] No valid data to validate");
      denyAccess("Invalid scan data");
    }

    // Reset for next scan
    cardCode = 0;
    bitCount = 0;
    currentBit = 0;
    memset((void*)bitBuffer, 0, sizeof(bitBuffer));
  }

  // Background WiFi maintenance
  static unsigned long lastWiFiCheck = 0;
  if (millis() - lastWiFiCheck > 30000) {
    lastWiFiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WIFI] Connection lost, reconnecting...");
      connectWiFi();
    }
  }

  delay(10);
}

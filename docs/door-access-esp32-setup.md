# Door Access System - ESP32 Hardware Setup

**Date:** January 4, 2026
**Status:** Hardware test successful

---

## Hardware Components

| Component | Model | Function |
|-----------|-------|----------|
| QR Scanner | Chinese multi-protocol (Wiegand 26/34) | Reads QR codes |
| Microcontroller | TTGO T-Display V1.1 (ESP32) | Brain - processes scans, controls relay |
| Relay Module | 4-Channel 12V | Opens door lock |

---

## Wiring Configuration

| Scanner Wire | Color | ESP32 Pin |
|--------------|-------|-----------|
| D0 | Green | GPIO25 |
| D1 | White | GPIO26 |
| GND | Black | GND |
| +12V | Red | External power |

| Relay | ESP32 Pin |
|-------|-----------|
| IN1 | GPIO27 |
| GND | GND |

**Important:** D0/D1 wires were initially reversed - always verify with pulse test.

---

## Working ESP32 Code

```cpp
// DOOR ACCESS SYSTEM - Production Ready
// Wiegand decoder without library (library caused crashes)

#define D0_PIN 25
#define D1_PIN 26
#define RELAY_PIN 27

#define DOOR_OPEN_TIME 5000  // 5 seconds - adjust as needed

volatile unsigned long cardCode = 0;
volatile int bitCount = 0;
volatile unsigned long lastBitTime = 0;

void IRAM_ATTR d0_ISR() {
  if (millis() - lastBitTime > 50) {
    cardCode = 0;
    bitCount = 0;
  }
  cardCode <<= 1;
  bitCount++;
  lastBitTime = millis();
}

void IRAM_ATTR d1_ISR() {
  if (millis() - lastBitTime > 50) {
    cardCode = 0;
    bitCount = 0;
  }
  cardCode <<= 1;
  cardCode |= 1;
  bitCount++;
  lastBitTime = millis();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("DOOR ACCESS SYSTEM");
  Serial.print("Door open time: ");
  Serial.print(DOOR_OPEN_TIME / 1000);
  Serial.println(" seconds");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  pinMode(D0_PIN, INPUT_PULLUP);
  pinMode(D1_PIN, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(D0_PIN), d0_ISR, FALLING);
  attachInterrupt(digitalPinToInterrupt(D1_PIN), d1_ISR, FALLING);

  Serial.println("Ready - scan QR code...");
}

void loop() {
  if (bitCount > 0 && (millis() - lastBitTime > 100)) {

    Serial.println("**** QR CODE RECEIVED ****");
    Serial.print("Bits: ");
    Serial.println(bitCount);
    Serial.print("Code: ");
    Serial.println(cardCode);

    Serial.println("OPENING DOOR...");
    digitalWrite(RELAY_PIN, HIGH);
    delay(DOOR_OPEN_TIME);
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("DOOR CLOSED");

    bitCount = 0;
    cardCode = 0;
  }

  delay(10);
}
```

---

## Key Learnings

1. **Wiegand Library Crashes ESP32** - The standard Wiegand library caused the ESP32 to reset when receiving data. Solution: Manual interrupt-based decoder.

2. **Wires Were Reversed** - Initial D0/D1 connection showed 0 pulses. Reversing the wires fixed it.

3. **26-bit Wiegand Format** - Each scan produces ~26 bits (D0 + D1 pulses combined).

4. **Upload Issues** - ESP32 needs BOOT button held during upload. Also disconnect GPIO wires before uploading.

5. **Upload Speed** - Use 115200 baud for reliable uploads.

---

## Arduino IDE Setup

1. **Board Manager URL:** `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
2. **Board:** ESP32 Dev Module
3. **Upload Speed:** 115200
4. **Port:** `/dev/cu.usbserial-xxxxx` (Mac)

---

## Test Results

| Test | Result |
|------|--------|
| Pulse counting | ✅ D0: 15, D1: 11 per scan |
| Wiegand decoding | ✅ 26 bits, code: 22696558 |
| Relay trigger | ✅ Clicks for configured time |
| Full QR scan → door open | ✅ Working |

---

## Next Steps (CRM Integration)

1. Add WiFi connectivity to ESP32
2. Create Supabase Edge Function for validation
3. ESP32 calls API with scanned code
4. API checks member subscription status
5. Returns `{ "allowed": true/false }`
6. ESP32 opens door or denies access

See `/docs/door-access-integration.md` for full API specification.

---

## Quick Reference

**Adjust door open time:**
```cpp
#define DOOR_OPEN_TIME 5000  // milliseconds
```

**Test relay only:**
```cpp
void loop() {
  digitalWrite(RELAY_PIN, HIGH);
  delay(1000);
  digitalWrite(RELAY_PIN, LOW);
  delay(3000);
}
```

---

*Last updated: January 4, 2026*

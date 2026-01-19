# Door Access - Volgende Stappen

**Datum:** 19 januari 2026
**Status:** Hardware TEST MODE werkt! ✅

---

## Wat is getest en werkt

| Component | Status |
|-----------|--------|
| ESP32 + WiFi | ✅ Verbonden met "Msd" netwerk |
| QR Scanner (Wiegand) | ✅ Leest codes correct (26 bits) |
| Relay/Deur | ✅ Opent 5 seconden |
| FightFlow App | ✅ Toont QR code op telefoon |

**Test resultaat:**
```
WiFi CONNECTED!
IP: 192.168.0.214
**** QR CODE RECEIVED ****
Bits: 26
Code: 47830998
OPENING DOOR...
DOOR CLOSED
```

---

## Huidige situatie

De ESP32 draait in **TEST MODE**:
- Elke QR code opent de deur
- Geen validatie van abonnement
- Code: `~/Documents/Arduino/door_test_wifi/door_test_wifi.ino`

---

## VOLGENDE SESSIE: Production Mode

### Stap 1: Edge Functions deployen

De Edge Functions bestaan al maar moeten gedeployed worden:

```bash
cd /Users/mehdimichiels/Documents/GitHub/mma-gym-crm

# Deploy door-token (genereert QR tokens voor leden)
npx supabase functions deploy door-token

# Deploy door-validate (valideert QR bij scan)
npx supabase functions deploy door-validate
```

### Stap 2: JWT Secret instellen

```bash
npx supabase secrets set DOOR_JWT_SECRET="[genereer-een-veilige-key]"
```

### Stap 3: ESP32 code updaten naar Production Mode

In `door_test_wifi.ino`, verander onderaan in `loop()`:

**Van (TEST MODE):**
```cpp
// Open door (voor nu altijd - later API check)
Serial.println("OPENING DOOR...");
digitalWrite(RELAY_PIN, HIGH);
delay(DOOR_OPEN_TIME);
digitalWrite(RELAY_PIN, LOW);
Serial.println("DOOR CLOSED");
```

**Naar (PRODUCTION MODE):**
```cpp
// Validate via API
String qrCode = String(cardCode);
if (validateQR(qrCode)) {
  openDoor();
} else {
  Serial.println("ACCESS DENIED");
}
```

### Stap 4: HTTPClient code toevoegen

De `validateQR()` functie moet nog toegevoegd worden met HTTPClient.
Zie `/hardware/esp32-door-access/door_access_wifi.ino` voor complete versie met API calls.

### Stap 5: Testen

1. Upload nieuwe code naar ESP32
2. Open Serial Monitor
3. Scan QR code van lid MET actief abonnement → deur opent
4. Scan QR code van lid ZONDER abonnement → "ACCESS DENIED"

---

## Bestanden

| Bestand | Locatie |
|---------|---------|
| Werkende TEST code | `~/Documents/Arduino/door_test_wifi/door_test_wifi.ino` |
| Production code template | `hardware/esp32-door-access/door_access_wifi.ino` |
| Edge Function: token | `supabase/functions/door-token/` |
| Edge Function: validate | `supabase/functions/door-validate/` |
| Technische docs | `docs/door-access-integration.md` |
| Hardware setup | `docs/door-access-esp32-setup.md` |

---

## WiFi Credentials (voor reference)

- **SSID:** Msd
- **Password:** MMAalst0924!
- **ESP32 IP:** 192.168.0.214

---

## Quick Resume Checklist

Volgende sessie, zeg: "Laten we door access production mode implementeren"

Claude zal dan:
1. Edge functions deployen
2. ESP32 code updaten met API validatie
3. Testen met echte leden

---

*Laatste test: 19 januari 2026 21:06*

# Open Issues & Enhancements

## Non-Critical Enhancements

### ~~Database Function: check_member_door_access missing team role bypass~~ RESOLVED
**Date**: 2026-02-01 | **Resolved**: 2026-02-02 (Phase 7, Plan 07-02)
**Resolution**: SQL fix created at `supabase/sql/fix_door_access_team_bypass.sql`. Apply via Supabase SQL Editor (migration sync blocker still applies).

---

### ISS-001: Flash ESP32 with production firmware
**Date**: 2026-02-02
**Phase**: 7 (Door Access & QR Integration)
**Severity**: Medium (blocks physical door access testing)
**Description**: ESP32 firmware updated in code (`hardware/esp32-door-access/door_access_wifi.ino`) with production mode, apikey header, and long QR JWT data handling. Needs to be physically flashed to the device.

**Steps when at the gym:**
1. Open Arduino IDE
2. Open `hardware/esp32-door-access/door_access_wifi.ino`
3. Select Board: "TTGO T-Display" (ESP32)
4. Connect ESP32 via USB, upload sketch
5. Open Serial Monitor (115200 baud)
6. Verify: WiFi connects and "READY" message appears

---

### ISS-002: End-to-end hardware door access testing
**Date**: 2026-02-02
**Phase**: 7 (Door Access & QR Integration)
**Severity**: Medium (blocks full verification of door access system)
**Description**: After flashing ESP32 (ISS-001), perform end-to-end testing:

**Tests:**
1. Generate QR code from member detail page → scan with Wiegand reader → door should open
2. Use expired QR code → door should stay closed
3. Member without subscription → error on QR generation
4. Staff member without subscription → QR generates, door opens (team bypass)
5. If QR scanner can't read JWT → may need short numeric token approach (see plan 07-03 context)

**Depends on**: ISS-001 (ESP32 must be flashed first)

---

### ISS-003: Apply check_member_door_access SQL fix via SQL Editor
**Date**: 2026-02-02
**Phase**: 7 (Door Access & QR Integration)
**Severity**: Low (function not used in production, Edge Function handles correctly)
**Description**: Copy contents of `supabase/sql/fix_door_access_team_bypass.sql` into Supabase SQL Editor and execute. Adds team role bypass to the database function.

---

### ISS-004: DoorTest page E2E testing deferred
**Date**: 2026-02-02
**Phase**: 8 (Functionality Audit & E2E Testing)
**Severity**: Low (admin-only page, depends on hardware)
**Description**: DoorTest page (`/door-test`) excluded from Phase 8 E2E tests. Testing requires physical ESP32 hardware (ISS-001/002). Add E2E tests for DoorTest page after hardware is available and flashed.

**Depends on**: ISS-001, ISS-002

---

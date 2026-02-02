---
phase: 07-door-access-qr-integration
plan: 03
subsystem: hardware
tags: [esp32, wiegand, qr, firmware, iot]

requires:
  - phase: 07-01
    provides: deployed door-validate with apikey auth
  - phase: 07-02
    provides: frontend components updated for production
provides:
  - ESP32 production firmware with JWT QR handling
  - Long Wiegand data buffering for QR codes
affects: [beta-deployment, door-access-monitoring]

tech-stack:
  added: []
  patterns: [wiegand-ascii-buffering, multi-format-qr-detection]

key-files:
  created: []
  modified: [hardware/esp32-door-access/door_access_wifi.ino]

key-decisions:
  - "Detect QR vs card by bit count: >100 bits = QR/ASCII, 26 bits = standard Wiegand"
  - "Buffer up to 2048 bits for JWT reconstruction from Wiegand scanner"
  - "Hardware flashing deferred — ESP32 not physically accessible"

patterns-established:
  - "Wiegand long-data: buffer bits, reconstruct ASCII after 100ms timeout"

issues-created: [ISS-001, ISS-002]

duration: 8min
completed: 2026-02-02
---

# Phase 7 Plan 3: ESP32 Production Firmware Summary

**ESP32 firmware updated for production mode with JWT QR data handling; hardware flashing deferred (not physically accessible)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-02T10:30:00Z
- **Completed:** 2026-02-02T10:38:00Z
- **Tasks:** 1/3 (Task 1 complete, Tasks 2-3 deferred — hardware checkpoints)
- **Files modified:** 1

## Accomplishments
- ESP32 firmware switched from test mode to production mode (API validation)
- Added apikey header for door-validate Edge Function authentication
- Implemented long QR data buffering: detects >100 bit Wiegand data as QR/ASCII
- 2048-bit buffer with ASCII reconstruction for JWT tokens
- WiFi failure handling (graceful deny, no crash)
- Serial debug output for hardware testing

## Task Commits

1. **Task 1: Update ESP32 firmware for production mode** - `6e97b4e` (feat)

Tasks 2-3 (checkpoint:human-action + checkpoint:human-verify) deferred to ISS-001/ISS-002.

**Plan metadata:** (included in orchestrator commit)

## Files Created/Modified
- `hardware/esp32-door-access/door_access_wifi.ino` - Production mode, QR JWT handling, apikey header

## Decisions Made
- Detect data format by bit count threshold (>100 = QR, 26 = card)
- Buffer 2048 bits max for JWT reconstruction
- Filter for printable ASCII characters (32-126) during reconstruction
- Defer hardware testing to when ESP32 is physically accessible

## Deviations from Plan

### Deferred Checkpoints

**Tasks 2-3 deferred (hardware not physically accessible):**
- Task 2 (checkpoint:human-action): Flash ESP32 with updated firmware — logged as ISS-001
- Task 3 (checkpoint:human-verify): End-to-end hardware testing — logged as ISS-002

User confirmed ESP32 is not in their current location. USB-C connection required for flashing.

### Deferred Enhancements

Logged to .planning/ISSUES.md:
- ISS-001: Flash ESP32 with production firmware (steps documented)
- ISS-002: End-to-end hardware door access testing (test scenarios documented)
- ISS-003: Apply check_member_door_access SQL fix via SQL Editor

---

**Total deviations:** 0 auto-fixed, 2 checkpoints deferred (hardware inaccessible)
**Impact on plan:** Code-side work 100% complete. Hardware verification pending physical access.

## Issues Encountered
- ESP32 not physically accessible for flashing — checkpoints deferred with detailed steps in ISSUES.md

## Next Phase Readiness
- All software components production-ready (Edge Functions deployed, frontend updated, firmware written)
- Hardware testing blocked on physical access to ESP32
- Phase can be considered software-complete; hardware verification is ISS-001 + ISS-002

---
*Phase: 07-door-access-qr-integration*
*Completed: 2026-02-02 (software), hardware pending*

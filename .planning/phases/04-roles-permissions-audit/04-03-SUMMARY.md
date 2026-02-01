---
phase: 04-roles-permissions-audit
plan: 03
subsystem: auth
tags: [permissions, rbac, sidebar, usePermissions, role-guard]

# Dependency graph
requires:
  - phase: 04-01
    provides: RoleGuard component and route-level access control
  - phase: 04-02
    provides: Member management permission checks pattern
provides:
  - Action-level permission checks on all remaining pages
  - Sidebar visibility matching route guards
  - Complete RBAC enforcement across entire app
affects: [phase-5, phase-8, phase-9]

# Tech tracking
tech-stack:
  added: []
  patterns: [permission-based sidebar filtering, action-level defense-in-depth]

key-files:
  created: []
  modified: [src/pages/Leads.tsx, src/components/leads/LeadDetailModal.tsx, src/pages/Schedule.tsx, src/pages/Subscriptions.tsx, src/pages/Team.tsx, src/pages/Settings.tsx, src/components/layout/Sidebar.tsx]

key-decisions:
  - "Hide action buttons rather than disable them for non-privileged users"
  - "Sidebar uses permission field mapped to usePermissions keys for flexible visibility"
  - "Settings sections have adminOnly flag for granular access within staff-accessible page"

patterns-established:
  - "Permission-based sidebar filtering: nav items have optional permission field checked against usePermissions"
  - "Three-layer access control: route guard -> action-level checks -> sidebar visibility"

issues-created: []

# Metrics
duration: 20min
completed: 2026-02-01
---

# Phase 4 Plan 3: Remaining Pages + Sidebar Audit Summary

**Action-level permission checks on all remaining pages with sidebar visibility matching route guards for complete RBAC enforcement**

## Performance

- **Duration:** 20 min
- **Started:** 2026-02-01T18:08:22Z
- **Completed:** 2026-02-01T18:28:40Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 7

## Accomplishments
- Permission checks added to Leads, Schedule, Subscriptions, Team, and Settings pages
- Sidebar visibility updated with permission-based filtering matching route guards
- Complete three-layer RBAC: route guards, action-level checks, sidebar visibility
- Human-verified: checkpoint approved

## Task Commits

Each task was committed atomically:

1. **Task 1: Add action-level permission checks to remaining pages** - `ae7e587` (feat)
2. **Task 2: Audit sidebar visibility to match route guards** - `c16920d` (feat)
3. **Task 3: Human verification** - checkpoint approved

## Files Created/Modified
- `src/pages/Leads.tsx` - canManageLeads check on "Nieuwe Lead" button
- `src/components/leads/LeadDetailModal.tsx` - canManageLeads on save, canEditMembers on convert
- `src/pages/Schedule.tsx` - canManageSchedule on add/edit/delete class buttons, read-only for fighters
- `src/pages/Subscriptions.tsx` - canEditMembers on manage link and new subscription button
- `src/pages/Team.tsx` - isAdmin on add team member and edit buttons
- `src/pages/Settings.tsx` - adminOnly flag on sensitive sections (Betalingen, Gym Profiel, etc.)
- `src/components/layout/Sidebar.tsx` - permission field on nav items with usePermissions-based filtering

## Decisions Made
- Settings sections split into admin-only (Betalingen, Gym Profiel, Gebruikers & Rollen, Branding, Beveiliging) and staff-accessible (Onboarding, Rooster, Notificaties)
- CheckIn, SubscriptionsManage, and Reports pages needed no action-level changes (fully protected by route guards with no mixed-access content)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 4 (Roles, Permissions & Access Audit) is complete
- All 3 plans executed: route guards, member management permissions, remaining pages + sidebar
- Three-layer RBAC provides comprehensive access control
- Ready for Phase 5: Subscriptions & Billing Audit

---
*Phase: 04-roles-permissions-audit*
*Completed: 2026-02-01*

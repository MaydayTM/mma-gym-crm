# Open Issues & Enhancements

## Non-Critical Enhancements

### Database Function: check_member_door_access missing team role bypass
**Date**: 2026-02-01
**Severity**: Low (function not used in production)
**Description**: The database function `check_member_door_access` in migration 043 does not bypass subscription checks for team roles (admin, medewerker, coordinator, coach). The Edge Function `door-validate/index.ts` correctly implements this bypass, so door access works correctly in production.

**Impact**: If this database function is called directly in the future, staff members without active subscriptions would be incorrectly denied access.

**Suggested Fix**: Add role check before subscription validation:
```sql
-- Team roles bypass subscription check
IF v_member.role IN ('admin', 'medewerker', 'coordinator', 'coach') THEN
  RETURN QUERY SELECT true, (v_member.first_name || ' ' || v_member.last_name)::TEXT, NULL::TEXT;
  RETURN;
END IF;
```

**Blocker**: Migration sync issues between local and remote database prevent pushing new migration. Needs investigation of migration history.

---

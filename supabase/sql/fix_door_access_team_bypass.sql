-- Fix for check_member_door_access: Add team role bypass
-- Issue: Database function missing team role bypass (ISSUES.md)
-- Apply this via Supabase SQL Editor (migration sync issues prevent pushing as migration)

CREATE OR REPLACE FUNCTION check_member_door_access(p_member_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  member_name TEXT,
  denial_reason TEXT
) AS $$
DECLARE
  v_member RECORD;
  v_subscription RECORD;
BEGIN
  -- Get member with role column
  SELECT id, first_name, last_name, status, door_access_enabled, role
  INTO v_member
  FROM members
  WHERE id = p_member_id;

  -- Member not found
  IF v_member IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'member_not_found'::TEXT;
    RETURN;
  END IF;

  -- Door access disabled for this member
  IF NOT v_member.door_access_enabled THEN
    RETURN QUERY SELECT false, (v_member.first_name || ' ' || v_member.last_name)::TEXT, 'access_disabled'::TEXT;
    RETURN;
  END IF;

  -- Member not active
  IF v_member.status != 'active' THEN
    RETURN QUERY SELECT false, (v_member.first_name || ' ' || v_member.last_name)::TEXT, 'member_inactive'::TEXT;
    RETURN;
  END IF;

  -- *** FIX: Team roles bypass subscription check ***
  IF v_member.role IN ('admin', 'medewerker', 'coordinator', 'coach') THEN
    RETURN QUERY SELECT true, (v_member.first_name || ' ' || v_member.last_name)::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Check for active subscription (fighters only)
  SELECT id INTO v_subscription
  FROM member_subscriptions
  WHERE member_id = p_member_id
    AND status = 'active'
    AND end_date >= CURRENT_DATE
  ORDER BY end_date DESC
  LIMIT 1;

  IF v_subscription IS NULL THEN
    RETURN QUERY SELECT false, (v_member.first_name || ' ' || v_member.last_name)::TEXT, 'no_active_subscription'::TEXT;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, (v_member.first_name || ' ' || v_member.last_name)::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions for applying:
-- 1. Open Supabase SQL Editor
-- 2. Copy and paste this entire function
-- 3. Run the query
-- 4. Verify by calling: SELECT * FROM check_member_door_access('member-uuid-here');

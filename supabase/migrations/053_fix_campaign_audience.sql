-- Fix get_campaign_audience function
-- Problem: Filter arrays weren't being parsed correctly

DROP FUNCTION IF EXISTS get_campaign_audience(JSONB);

CREATE OR REPLACE FUNCTION get_campaign_audience(filter_json JSONB DEFAULT '{}')
RETURNS TABLE (
  member_id UUID,
  email VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR
) AS $$
DECLARE
  status_filter TEXT[];
  role_filter TEXT[];
  disciplines_filter TEXT[];
BEGIN
  -- Extract arrays from JSONB (handle both array and null cases)
  IF filter_json ? 'status' AND jsonb_typeof(filter_json->'status') = 'array' THEN
    SELECT array_agg(value::TEXT) INTO status_filter
    FROM jsonb_array_elements_text(filter_json->'status') AS value;
  END IF;

  IF filter_json ? 'role' AND jsonb_typeof(filter_json->'role') = 'array' THEN
    SELECT array_agg(value::TEXT) INTO role_filter
    FROM jsonb_array_elements_text(filter_json->'role') AS value;
  END IF;

  IF filter_json ? 'disciplines' AND jsonb_typeof(filter_json->'disciplines') = 'array' THEN
    SELECT array_agg(value::TEXT) INTO disciplines_filter
    FROM jsonb_array_elements_text(filter_json->'disciplines') AS value;
  END IF;

  RETURN QUERY
  SELECT
    m.id as member_id,
    m.email,
    m.first_name,
    m.last_name
  FROM members m
  WHERE
    -- Must have email
    m.email IS NOT NULL
    AND m.email != ''
    AND LENGTH(TRIM(m.email)) > 0
    -- Not unsubscribed
    AND NOT EXISTS (
      SELECT 1 FROM email_unsubscribes u WHERE u.email = LOWER(m.email)
    )
    -- Status filter (if provided and not empty)
    AND (
      status_filter IS NULL
      OR array_length(status_filter, 1) IS NULL
      OR array_length(status_filter, 1) = 0
      OR m.status = ANY(status_filter)
    )
    -- Role filter (if provided and not empty)
    AND (
      role_filter IS NULL
      OR array_length(role_filter, 1) IS NULL
      OR array_length(role_filter, 1) = 0
      OR m.role = ANY(role_filter)
    )
    -- Disciplines filter (any match, if provided and not empty)
    AND (
      disciplines_filter IS NULL
      OR array_length(disciplines_filter, 1) IS NULL
      OR array_length(disciplines_filter, 1) = 0
      OR m.disciplines && disciplines_filter
    )
  ORDER BY m.last_name, m.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_campaign_audience(JSONB) TO authenticated, anon;

-- Test the function (this will show results in the migration log)
-- SELECT * FROM get_campaign_audience('{"status": ["active"]}');

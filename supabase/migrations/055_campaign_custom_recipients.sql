-- Add support for custom recipient selection in campaigns
-- This allows users to manually select specific members instead of using filters

-- Add a column to store manually selected member IDs
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS custom_recipients UUID[] DEFAULT NULL;

-- Update the get_campaign_audience function to also handle custom recipients
DROP FUNCTION IF EXISTS get_campaign_audience(JSONB);

CREATE OR REPLACE FUNCTION get_campaign_audience(
  filter_json JSONB DEFAULT '{}',
  custom_member_ids UUID[] DEFAULT NULL
)
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
  -- If custom member IDs are provided, use those instead of filters
  IF custom_member_ids IS NOT NULL AND array_length(custom_member_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT
      m.id as member_id,
      m.email,
      m.first_name,
      m.last_name
    FROM members m
    WHERE
      m.id = ANY(custom_member_ids)
      AND m.email IS NOT NULL
      AND m.email != ''
      AND LENGTH(TRIM(m.email)) > 0
      -- Not unsubscribed
      AND NOT EXISTS (
        SELECT 1 FROM email_unsubscribes u WHERE u.email = LOWER(m.email)
      )
    ORDER BY m.last_name, m.first_name;
    RETURN;
  END IF;

  -- Otherwise use filter logic
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION get_campaign_audience(JSONB, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_audience(JSONB, UUID[]) TO anon;
GRANT EXECUTE ON FUNCTION get_campaign_audience(JSONB, UUID[]) TO service_role;

-- Create a helper function to search members for the custom selection UI
CREATE OR REPLACE FUNCTION search_members_for_email(
  search_query TEXT DEFAULT '',
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  member_id UUID,
  email VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  status VARCHAR,
  is_unsubscribed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as member_id,
    m.email,
    m.first_name,
    m.last_name,
    m.status,
    EXISTS (
      SELECT 1 FROM email_unsubscribes u WHERE u.email = LOWER(m.email)
    ) as is_unsubscribed
  FROM members m
  WHERE
    m.email IS NOT NULL
    AND m.email != ''
    AND LENGTH(TRIM(m.email)) > 0
    AND (
      search_query = ''
      OR m.first_name ILIKE '%' || search_query || '%'
      OR m.last_name ILIKE '%' || search_query || '%'
      OR m.email ILIKE '%' || search_query || '%'
    )
  ORDER BY m.last_name, m.first_name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION search_members_for_email(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_members_for_email(TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION search_members_for_email(TEXT, INT) TO service_role;

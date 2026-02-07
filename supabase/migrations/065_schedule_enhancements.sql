-- 065_schedule_enhancements.sql
-- Add image_url to disciplines and category to classes for schedule redesign

-- Add image_url to disciplines (for sport photos uploaded by admin)
ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add category to classes (group_session, personal_session, course)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'group_session'
  CHECK (category IN ('group_session', 'personal_session', 'course'));

-- Default all existing classes to group_session (already handled by DEFAULT)
UPDATE classes SET category = 'group_session' WHERE category IS NULL;

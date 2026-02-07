-- Fix class category values to match spec: group_class, event, private_session, course
-- Rename group_session → group_class, personal_session → private_session, add 'event'

-- 1. Drop old CHECK constraint (named or unnamed)
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_category_check;

-- 2. Update existing values
UPDATE classes SET category = 'group_class' WHERE category = 'group_session';
UPDATE classes SET category = 'private_session' WHERE category = 'personal_session';

-- 3. Set default and NOT NULL
UPDATE classes SET category = 'group_class' WHERE category IS NULL;
ALTER TABLE classes ALTER COLUMN category SET DEFAULT 'group_class';
ALTER TABLE classes ALTER COLUMN category SET NOT NULL;

-- 4. Add new CHECK constraint with all 4 categories
ALTER TABLE classes ADD CONSTRAINT classes_category_check
  CHECK (category IN ('group_class', 'event', 'private_session', 'course'));

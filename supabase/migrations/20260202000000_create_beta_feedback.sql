-- Create beta_feedback table for in-app user feedback
CREATE TABLE beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',  -- 'bug', 'feature', 'general', 'ux'
  message TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for querying by member and date
CREATE INDEX idx_beta_feedback_member ON beta_feedback(member_id);
CREATE INDEX idx_beta_feedback_created ON beta_feedback(created_at DESC);
CREATE INDEX idx_beta_feedback_category ON beta_feedback(category);

-- Enable RLS
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Authenticated users can submit their own feedback
CREATE POLICY "Users can submit feedback" ON beta_feedback
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Admins can read all feedback (using app-layer permission check pattern)
-- Following the established pattern: USING(true) + app-layer role checks
CREATE POLICY "Admins can read all feedback" ON beta_feedback
  FOR SELECT
  USING (true);

-- Comment explaining the table
COMMENT ON TABLE beta_feedback IS 'Beta tester feedback submissions for tracking bugs, feature requests, and UX issues';

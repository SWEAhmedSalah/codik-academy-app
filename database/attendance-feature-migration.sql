-- ========================================
-- Session Attendance Feature Migration
-- Run this once in the Supabase SQL editor.
-- ========================================

-- 1. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, student_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_name ON attendance(student_name);

-- 2. Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to attendance" ON attendance;
DROP POLICY IF EXISTS "Allow admin full access to attendance" ON attendance;

-- Anyone authenticated can read attendance rows (students only ever query their
-- own student_name from the app layer; admins query everything)
CREATE POLICY "Allow read access to attendance" ON attendance
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete attendance directly via the table.
-- (Writes normally go through the mark_attendance() RPC below, which bypasses
-- RLS the same way update_submission_status() does for submissions.)
CREATE POLICY "Allow admin full access to attendance" ON attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND user_roles.role = 'Admin'
    )
  );

-- 3. RPC to upsert attendance, bypassing RLS restrictions for admins
-- (mirrors the existing update_submission_status() pattern used for submissions)
CREATE OR REPLACE FUNCTION mark_attendance(
  p_session_id INTEGER,
  p_student_name TEXT,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO attendance (session_id, student_name, status, marked_at)
  VALUES (p_session_id, p_student_name, p_status, NOW())
  ON CONFLICT (session_id, student_name)
  DO UPDATE SET status = EXCLUDED.status, marked_at = NOW();
END;
$$;

-- ========================================
-- Migration Complete
-- ========================================

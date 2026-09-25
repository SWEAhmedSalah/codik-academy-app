-- ========================================
-- Admin Course Catalog Management Migration
-- Created: August 22, 2026
-- ========================================

-- 1. Create course_sections table
CREATE TABLE IF NOT EXISTS course_sections (
  id BIGSERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_order ON course_sections(course_id, order_index);

-- 2. Add new columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES course_sections(id) ON DELETE SET NULL;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT FALSE;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'live', 'article', 'quiz', 'assignment'));

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_section_id ON sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_order ON sessions(course_id, section_id, order_index);

-- 3. Add new columns to courses table
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS total_sections INTEGER DEFAULT 0;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];

-- 4. Create trigger function to update course sections count
CREATE OR REPLACE FUNCTION update_course_sections_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE courses
    SET total_sections = (
      SELECT COUNT(*) FROM course_sections
      WHERE course_id = OLD.course_id
    )
    WHERE id = OLD.course_id;
    RETURN OLD;
  ELSE
    UPDATE courses
    SET total_sections = (
      SELECT COUNT(*) FROM course_sections
      WHERE course_id = NEW.course_id
    )
    WHERE id = NEW.course_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_sections_count_trigger ON course_sections;

-- Create trigger
CREATE TRIGGER update_sections_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON course_sections
FOR EACH ROW EXECUTE FUNCTION update_course_sections_count();

-- 5. Create trigger function to update section lessons count
CREATE OR REPLACE FUNCTION update_section_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.section_id IS NOT NULL THEN
    UPDATE course_sections
    SET total_lessons = (
      SELECT COUNT(*) FROM sessions
      WHERE section_id = OLD.section_id
    )
    WHERE id = OLD.section_id;
    RETURN OLD;
  ELSIF NEW.section_id IS NOT NULL THEN
    UPDATE course_sections
    SET total_lessons = (
      SELECT COUNT(*) FROM sessions
      WHERE section_id = NEW.section_id
    )
    WHERE id = NEW.section_id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_section_lessons_trigger ON sessions;

-- Create trigger
CREATE TRIGGER update_section_lessons_trigger
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION update_section_lessons_count();

-- 6. Initialize counts for existing data
UPDATE courses
SET total_sections = (
  SELECT COUNT(*) FROM course_sections WHERE course_id = courses.id
);

UPDATE course_sections
SET total_lessons = (
  SELECT COUNT(*) FROM sessions WHERE section_id = course_sections.id
);

-- 7. RLS Policies for course_sections (if RLS is enabled)
-- Enable RLS
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to course sections" ON course_sections;
DROP POLICY IF EXISTS "Allow read access to course sections" ON course_sections;
DROP POLICY IF EXISTS "Allow admin full access to course sections" ON course_sections;

-- UPDATED: More permissive policy that allows:
-- 1. Public read access to sections of Published courses
-- 2. Enrolled students can see sections of their enrolled courses (even if Draft)
-- 3. Admins can see all sections
CREATE POLICY "Allow read access to course sections" ON course_sections
  FOR SELECT
  USING (
    -- Public can see sections of published courses
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_sections.course_id
      AND courses.status = 'Published'
    )
    OR
    -- Enrolled users can see sections of their enrolled courses
    EXISTS (
      SELECT 1 FROM user_course_enrollments
      WHERE user_course_enrollments.course_id = course_sections.course_id
      AND user_course_enrollments.user_id = auth.uid()::text
    )
    OR
    -- Admins can see all sections
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND user_roles.role = 'Admin'
    )
  );

-- Allow admins full access (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow admin full access to course sections" ON course_sections
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM user_roles WHERE role = 'Admin'
    )
  );

-- ========================================
-- Migration Complete
-- ========================================
-- To verify:
-- SELECT * FROM course_sections;
-- SELECT course_id, section_id, is_preview, content_type FROM sessions;
-- SELECT total_sections FROM courses;


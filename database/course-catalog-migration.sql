-- ============================================================
-- Course Catalog & Course Details Migration
-- Date: August 21, 2026
-- Description: Add course catalog features and metadata
-- ============================================================

-- Add new columns to courses table
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS learning_objectives TEXT[],
  ADD COLUMN IF NOT EXISTS course_duration_hours INTEGER DEFAULT 0;

-- ============================================================
-- Trigger: Auto-update total_lessons count
-- ============================================================
CREATE OR REPLACE FUNCTION update_course_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE courses
    SET total_lessons = (
      SELECT COUNT(*) FROM sessions
      WHERE course_id = NEW.course_id AND status = 'Published'
    )
    WHERE id = NEW.course_id;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    UPDATE courses
    SET total_lessons = (
      SELECT COUNT(*) FROM sessions
      WHERE course_id = OLD.course_id AND status = 'Published'
    )
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_lessons_count_trigger ON sessions;
CREATE TRIGGER update_lessons_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION update_course_lessons_count();

-- ============================================================
-- Trigger: Auto-update total_students count
-- ============================================================
CREATE OR REPLACE FUNCTION update_course_students_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    UPDATE courses
    SET total_students = (
      SELECT COUNT(*) FROM user_course_enrollments
      WHERE course_id = NEW.course_id
    )
    WHERE id = NEW.course_id;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    UPDATE courses
    SET total_students = (
      SELECT COUNT(*) FROM user_course_enrollments
      WHERE course_id = OLD.course_id
    )
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_students_count_trigger ON user_course_enrollments;
CREATE TRIGGER update_students_count_trigger
AFTER INSERT OR DELETE ON user_course_enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_students_count();

-- ============================================================
-- Optional: Create course_sections table for better organization
-- ============================================================
CREATE TABLE IF NOT EXISTS course_sections (
  id BIGSERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add section_id to sessions table (optional)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES course_sections(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_section_id ON sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_course_id ON user_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);

-- ============================================================
-- Update existing data (one-time operations)
-- ============================================================

-- Calculate and set total_lessons for existing courses
UPDATE courses
SET total_lessons = (
  SELECT COUNT(*) FROM sessions
  WHERE sessions.course_id = courses.id AND sessions.status = 'Published'
);

-- Calculate and set total_students for existing courses
UPDATE courses
SET total_students = (
  SELECT COUNT(*) FROM user_course_enrollments
  WHERE user_course_enrollments.course_id = courses.id
);

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON COLUMN courses.rating IS 'Average course rating (0-5 scale, 2 decimal places)';
COMMENT ON COLUMN courses.total_students IS 'Total number of enrolled students (auto-updated by trigger)';
COMMENT ON COLUMN courses.total_lessons IS 'Total number of published lessons (auto-updated by trigger)';
COMMENT ON COLUMN courses.learning_objectives IS 'Array of learning objective strings';
COMMENT ON COLUMN courses.course_duration_hours IS 'Estimated course duration in hours';

-- ============================================================
-- Migration Complete
-- ============================================================


-- ========================================
-- Add Missing Columns to Courses Table
-- Created: August 22, 2026
-- Fixed: All course catalog columns
-- Handles both JSONB and TEXT[] for learning_objectives
-- ========================================

-- Add missing columns (excluding learning_objectives which may already exist)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS course_duration_hours INTEGER DEFAULT 0;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS total_sections INTEGER DEFAULT 0;

-- Handle learning_objectives separately (may be JSONB or TEXT[])
-- Check if column exists and add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'learning_objectives'
  ) THEN
    -- Column doesn't exist, create as TEXT[]
    ALTER TABLE courses ADD COLUMN learning_objectives TEXT[];
  END IF;
END $$;

-- Update NULL values based on column type
DO $$
BEGIN
  -- Check if it's JSONB type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses'
      AND column_name = 'learning_objectives'
      AND data_type = 'jsonb'
  ) THEN
    -- Update JSONB type
    UPDATE courses
    SET learning_objectives = '[]'::jsonb
    WHERE learning_objectives IS NULL;
  ELSE
    -- Update TEXT[] type
    UPDATE courses
    SET learning_objectives = ARRAY[]::TEXT[]
    WHERE learning_objectives IS NULL;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN courses.rating IS 'Average course rating (0-5 scale, 2 decimal places)';
COMMENT ON COLUMN courses.total_students IS 'Total number of enrolled students';
COMMENT ON COLUMN courses.total_lessons IS 'Total number of published lessons';
COMMENT ON COLUMN courses.learning_objectives IS 'Array of learning objective strings (JSONB or TEXT[])';
COMMENT ON COLUMN courses.course_duration_hours IS 'Estimated course duration in hours';
COMMENT ON COLUMN courses.total_sections IS 'Total number of course sections';

-- Verify all columns exist
SELECT
  column_name,
  data_type,
  column_default,
  CASE
    WHEN column_default IS NULL THEN 'No default'
    ELSE 'Has default'
  END as default_status
FROM information_schema.columns
WHERE table_name = 'courses'
  AND column_name IN ('rating', 'total_students', 'total_lessons', 'learning_objectives', 'course_duration_hours', 'total_sections')
ORDER BY column_name;

-- ========================================
-- Success Message
-- ========================================
SELECT 'All missing columns have been added successfully!' as status;

-- ========================================
-- Instructions:
-- 1. Open Supabase SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run"
-- 4. Verify output shows all 6 columns
-- ========================================



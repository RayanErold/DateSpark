-- ============================================================
-- DateSpark — Social Features Migration
-- Run this in your Supabase SQL Editor (once only)
-- ============================================================

-- 1. Add Boost columns to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS boost_count int DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS boosted_by uuid[] DEFAULT '{}';

-- 2. Create the per-stop place_ratings table
CREATE TABLE IF NOT EXISTS place_ratings (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id     uuid REFERENCES plans(id) ON DELETE CASCADE,
    place_name  text NOT NULL,
    place_id    text,
    rating      int CHECK (rating BETWEEN 1 AND 5),
    comment     text,
    quick_tag   text,
    user_id     uuid,
    created_at  timestamptz DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE place_ratings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'place_ratings' AND policyname = 'Anyone can read place ratings'
  ) THEN
    CREATE POLICY "Anyone can read place ratings"
      ON place_ratings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'place_ratings' AND policyname = 'Users can insert their own ratings'
  ) THEN
    CREATE POLICY "Users can insert their own ratings"
      ON place_ratings FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 4. Index for fast lookups by plan
CREATE INDEX IF NOT EXISTS place_ratings_plan_id_idx ON place_ratings(plan_id);

-- Done! ✅


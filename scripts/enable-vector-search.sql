-- =============================================================
-- DateSpark Migration: Enable pgvector & Semantic Search
-- Run this in your Supabase SQL editor.
-- =============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop the column if it exists to clean up 1536 vs 768 mismatch
ALTER TABLE plans DROP COLUMN IF EXISTS prompt_embedding;

-- 3. Re-create the column with 768 dimensions for Gemini text-embedding-004
ALTER TABLE plans ADD COLUMN prompt_embedding vector(768);

-- 4. Create a spatial index (HNSW) for faster similarity queries
CREATE INDEX IF NOT EXISTS plans_prompt_embedding_hnsw_idx 
ON plans USING hnsw (prompt_embedding vector_cosine_ops);

-- 5. Create RPC match function for semantic similarity searches
CREATE OR REPLACE FUNCTION match_plans (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  location_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  location text,
  vibe text,
  budget text,
  itinerary jsonb,
  boost_count int,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    plans.id,
    plans.user_id,
    plans.title,
    plans.description,
    plans.location,
    plans.vibe,
    plans.budget,
    plans.itinerary,
    plans.boost_count,
    plans.created_at,
    1 - (plans.prompt_embedding <=> query_embedding) AS similarity
  FROM plans
  WHERE
    plans.deleted_at IS NULL
    AND plans.is_completed = false
    AND plans.prompt_embedding IS NOT NULL
    AND (location_filter IS NULL OR plans.location ILIKE '%' || location_filter || '%')
    AND 1 - (plans.prompt_embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

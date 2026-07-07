-- Google Places API Caching Table Migration
-- Run this in your Supabase SQL Editor to enable persistent caching across server instances.

CREATE TABLE IF NOT EXISTS public.google_places_cache (
    query TEXT PRIMARY KEY,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.google_places_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow public read access (if needed, though backend uses service role by default)
CREATE POLICY "Allow public read access" ON public.google_places_cache
    FOR SELECT USING (true);

-- Allow service role / admin to perform all actions
CREATE POLICY "Allow service role write access" ON public.google_places_cache
    FOR ALL USING (true);

-- =============================================================
-- DateSpark Migration: Clean Up Unused Features
-- Drops Gift Cards, Plan Collaborations, and Stop Votes tables
-- Run this in your Supabase SQL editor.
-- =============================================================

DROP TABLE IF EXISTS public.gift_cards CASCADE;
DROP TABLE IF EXISTS public.stop_votes CASCADE;
DROP TABLE IF EXISTS public.plan_collaborations CASCADE;

-- Done! ✅

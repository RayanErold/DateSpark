-- =============================================================
-- DateSpark Migration: Third-Party Brand Gift Cards Extension
-- Run this in your Supabase SQL editor.
-- =============================================================

-- 1. Make plan_type nullable to accommodate brand gift cards
ALTER TABLE gift_cards ALTER COLUMN plan_type DROP NOT NULL;

-- 2. Drop the original check constraint on plan_type if it exists to prevent validation failures
ALTER TABLE gift_cards DROP CONSTRAINT IF EXISTS gift_cards_plan_type_check;

-- 3. Add brand gift card tracking columns
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS gift_card_type TEXT CHECK (gift_card_type IN ('datespark_pass', 'brand')) DEFAULT 'datespark_pass';
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS face_value DECIMAL(10, 2);
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS external_claim_url TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS external_claim_code TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS external_claim_pin TEXT;

-- =============================================================
-- DateSpark Migration: Partner Collaboration + Gift Cards
-- Run this in your Supabase SQL editor.
-- =============================================================

-- ─── GIFT CARDS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(16) UNIQUE NOT NULL,
    plan_type      TEXT CHECK (plan_type IN ('24H', 'COUPLES_MONTH', 'COUPLES_YEAR', 'ELITE')),
    purchaser_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255),
    recipient_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    message        TEXT,
    status         TEXT CHECK (status IN ('active', 'redeemed', 'expired')) DEFAULT 'active',
    stripe_session_id TEXT,
    created_at     TIMESTAMPTZ DEFAULT now(),
    redeemed_at    TIMESTAMPTZ,
    expires_at     TIMESTAMPTZ DEFAULT now() + INTERVAL '365 days'
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code           ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON gift_cards(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status          ON gift_cards(status);

-- RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own gift cards"
    ON gift_cards FOR SELECT
    USING (auth.uid() = purchaser_id OR auth.uid() = recipient_id);


-- ─── PLAN COLLABORATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_collaborations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID REFERENCES plans(id) ON DELETE CASCADE,
    owner_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
    partner_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status          TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    invite_token    VARCHAR(64) UNIQUE,
    is_surprise_mode BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    expires_at      TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_collab_plan_id     ON plan_collaborations(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_invite_token ON plan_collaborations(invite_token);
CREATE INDEX IF NOT EXISTS idx_collab_owner        ON plan_collaborations(owner_id);
CREATE INDEX IF NOT EXISTS idx_collab_partner      ON plan_collaborations(partner_id);

ALTER TABLE plan_collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and partners can read collaborations"
    ON plan_collaborations FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = partner_id);
CREATE POLICY "Anyone can accept via token (service role handles this)"
    ON plan_collaborations FOR UPDATE
    USING (true);


-- ─── STOP VOTES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stop_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id     UUID REFERENCES plans(id) ON DELETE CASCADE,
    stop_index  INT,
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vote        TEXT CHECK (vote IN ('love', 'maybe', 'skip')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plan_id, stop_index, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_plan_id ON stop_votes(plan_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON stop_votes(user_id);

ALTER TABLE stop_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read votes on their plans"
    ON stop_votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM plan_collaborations pc
            WHERE pc.plan_id = stop_votes.plan_id
            AND (pc.owner_id = auth.uid() OR pc.partner_id = auth.uid())
        )
    );
CREATE POLICY "Users can insert their own votes"
    ON stop_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes"
    ON stop_votes FOR UPDATE
    USING (auth.uid() = user_id);

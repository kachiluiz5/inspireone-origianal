-- =====================================================
-- InspireOne Database Schema
-- =====================================================
-- This file contains the complete database schema for the InspireOne voting application.
-- Import this into your Supabase SQL Editor to set up all tables, functions, and policies.

-- =====================================================
-- 1. TABLES
-- =====================================================

-- People Table: Stores all inspirational figures
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 1,
    last_trend TEXT NOT NULL DEFAULT 'neutral' CHECK (last_trend IN ('up', 'down', 'neutral')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trending Table: Tracks trending metrics and historical data
CREATE TABLE IF NOT EXISTS trending (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    votes_today INTEGER NOT NULL DEFAULT 0,
    votes_this_week INTEGER NOT NULL DEFAULT 0,
    rank_change INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for fast leaderboard queries (ORDER BY vote_count DESC)
CREATE INDEX IF NOT EXISTS idx_people_vote_count ON people(vote_count DESC);

-- Index for quick lookups by handle (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_people_handle_lower ON people(LOWER(handle));

-- Index for trending analytics
CREATE INDEX IF NOT EXISTS idx_trending_person_recorded ON trending(person_id, recorded_at DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_people_category ON people(category);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending ENABLE ROW LEVEL SECURITY;

-- Public read access for people table
CREATE POLICY "Allow public read access on people"
    ON people
    FOR SELECT
    TO public
    USING (true);

-- Public read access for trending table
CREATE POLICY "Allow public read access on trending"
    ON trending
    FOR SELECT
    TO public
    USING (true);

-- No direct write access - all writes go through RPC functions
-- This ensures data integrity and proper business logic

-- =====================================================
-- 4. DATABASE FUNCTIONS (RPC)
-- =====================================================

-- Function to handle voting logic
-- This function either creates a new person or increments their vote count
CREATE OR REPLACE FUNCTION vote_for_person(
    p_handle TEXT,
    p_name TEXT,
    p_category TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_person_id UUID;
    v_vote_count INTEGER;
    v_is_new BOOLEAN := false;
BEGIN
    -- Normalize handle (lowercase, trim)
    p_handle := LOWER(TRIM(p_handle));
    
    -- Check if person exists
    SELECT id, vote_count INTO v_person_id, v_vote_count
    FROM people
    WHERE LOWER(handle) = p_handle;
    
    IF v_person_id IS NULL THEN
        -- Person doesn't exist, create new entry
        INSERT INTO people (name, handle, category, vote_count, last_trend)
        VALUES (p_name, p_handle, p_category, 1, 'up')
        RETURNING id, vote_count INTO v_person_id, v_vote_count;
        
        v_is_new := true;
    ELSE
        -- Person exists, increment vote count
        UPDATE people
        SET 
            vote_count = vote_count + 1,
            last_trend = 'up',
            updated_at = NOW()
        WHERE id = v_person_id
        RETURNING vote_count INTO v_vote_count;
    END IF;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'person_id', v_person_id,
        'vote_count', v_vote_count,
        'is_new', v_is_new
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to update trending data (can be called by a scheduled job)
CREATE OR REPLACE FUNCTION update_trending_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert current snapshot of all people into trending table
    INSERT INTO trending (person_id, votes_today, votes_this_week, rank_change)
    SELECT 
        id,
        vote_count,
        vote_count,
        0
    FROM people;
    
    -- Update last_trend based on vote velocity
    -- This is a simple implementation - can be enhanced with more sophisticated logic
    UPDATE people
    SET last_trend = CASE
        WHEN vote_count > 100 THEN 'up'
        WHEN vote_count < 10 THEN 'down'
        ELSE 'neutral'
    END;
END;
$$;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON people
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. SEED DATA (OPTIONAL - REMOVE IF NOT NEEDED)
-- =====================================================

-- Uncomment below to add some initial seed data for testing
-- This is optional and can be removed for production

/*
INSERT INTO people (name, handle, category, vote_count, last_trend) VALUES
    ('Elon Musk', 'elonmusk', 'Tech', 0, 'neutral'),
    ('Jensen Huang', 'nvidia', 'Tech', 0, 'neutral'),
    ('Sam Altman', 'sama', 'AI', 0, 'neutral')
ON CONFLICT (handle) DO NOTHING;
*/

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your database is now ready to use!
-- 
-- Next steps:
-- 1. Add your SUPABASE_URL and SUPABASE_ANON_KEY to .env.local
-- 2. Run your application with: npm run dev
-- 3. Start voting and watch the leaderboard grow!
-- =====================================================

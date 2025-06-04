-- Create badges table to store badge definitions
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- lucide icon name
  category TEXT NOT NULL
    CHECK (category IN ('distance','steps','streak','social','time','calories','special')),
  requirement_type TEXT NOT NULL
    CHECK (requirement_type IN ('total','single_activity','streak','condition')),
  rarity TEXT NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common','rare','epic','legendary')),
  requirement_value DECIMAL, -- numeric value for the requirement
  requirement_unit TEXT CHECK (requirement_unit IN ('meters','steps','calories','minutes','days','activities',NULL))  , -- 'meters', 'steps', 'calories', 'minutes', 'days'
  requirement_condition JSONB, -- for complex conditions
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_badges table to track which users have earned which badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  badge_id UUID NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress_data JSONB, -- store progress information
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_user_badges_profile
    FOREIGN KEY (address)
    REFERENCES profiles(address)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_badges_badge
    FOREIGN KEY (badge_id)
    REFERENCES badges(id)
    ON DELETE CASCADE,
    
  -- Unique constraint to prevent duplicate badge earnings
  UNIQUE(address, badge_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_user_badges_address ON user_badges(address);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- Create trigger for badges table
CREATE TRIGGER set_timestamp_badges
BEFORE UPDATE ON badges
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Badges policies (public read, admin write)
CREATE POLICY "Allow public read access to badges"
ON badges FOR SELECT TO public USING (true);

-- User badges policies
CREATE POLICY "Allow address-based select on user_badges"
ON user_badges FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'sub') = address);

CREATE POLICY "Allow address-based delete on user_badges"
ON user_badges FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'sub') = address);

CREATE POLICY "Allow address-based insert on user_badges"
ON user_badges FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub') = address);

CREATE POLICY "Allow address-based update on user_badges"
ON user_badges FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'sub') = address)
WITH CHECK ((auth.jwt() ->> 'sub') = address);

-- Insert initial badge definitions
INSERT INTO badges (name, description, icon, color, category, requirement_type, requirement_value, requirement_unit, rarity) VALUES
-- Distance badges
('First Steps', 'Complete your first recorded activity', 'footprints', '#22c55e', 'distance', 'single_activity', 1, 'meters', 'common'),
('Walker', 'Walk a total of 1 kilometer', 'map-pin', '#3b82f6', 'distance', 'total', 1000, 'meters', 'common'),
('Explorer', 'Walk a total of 10 kilometers', 'compass', '#8b5cf6', 'distance', 'total', 10000, 'meters', 'rare'),
('Adventurer', 'Walk a total of 50 kilometers', 'mountain', '#f59e0b', 'distance', 'total', 50000, 'meters', 'epic'),
('Marathon Master', 'Complete a single activity of 42.2km or more', 'trophy', '#ef4444', 'distance', 'single_activity', 42200, 'meters', 'legendary'),

-- Steps badges
('Step Starter', 'Take 1,000 steps in a single day', 'activity', '#22c55e', 'steps', 'single_activity', 1000, 'steps', 'common'),
('Step Counter', 'Take 5,000 steps in a single day', 'trending-up', '#3b82f6', 'steps', 'single_activity', 5000, 'steps', 'common'),
('Step Master', 'Take 10,000 steps in a single day', 'target', '#8b5cf6', 'steps', 'single_activity', 10000, 'steps', 'rare'),
('Step Legend', 'Take 20,000 steps in a single day', 'award', '#f59e0b', 'steps', 'single_activity', 20000, 'steps', 'epic'),

-- Streak badges
('Getting Started', 'Complete activities for 3 consecutive days', 'flame', '#f97316', 'streak', 'streak', 3, 'days', 'common'),
('Week Warrior', 'Complete activities for 7 consecutive days', 'zap', '#ef4444', 'streak', 'streak', 7, 'days', 'rare'),
('Month Master', 'Complete activities for 30 consecutive days', 'star', '#8b5cf6', 'streak', 'streak', 30, 'days', 'epic'),
('Unstoppable', 'Complete activities for 100 consecutive days', 'crown', '#f59e0b', 'streak', 'streak', 100, 'days', 'legendary'),

-- Time-based badges
('Early Bird', 'Complete a workout before 7:00 AM', 'sunrise', '#fbbf24', 'time', 'condition', NULL, NULL, 'common'),
('Night Owl', 'Complete a workout after 9:00 PM', 'moon', '#6366f1', 'time', 'condition', NULL, NULL, 'common'),
('Speed Demon', 'Complete a 30-minute workout', 'timer', '#ef4444', 'time', 'single_activity', 1800, 'seconds', 'rare'),
('Endurance Hero', 'Complete a 2-hour workout', 'clock', '#8b5cf6', 'time', 'single_activity', 7200, 'seconds', 'epic'),

-- Calorie badges
('Calorie Burner', 'Burn 200 calories in a single workout', 'flame', '#f97316', 'calories', 'single_activity', 200, 'calories', 'common'),
('Heat Wave', 'Burn 500 calories in a single workout', 'thermometer', '#ef4444', 'calories', 'single_activity', 500, 'calories', 'rare'),
('Inferno', 'Burn 1000 calories in a single workout', 'fire', '#dc2626', 'calories', 'single_activity', 1000, 'calories', 'epic'),

-- Social badges
('Team Player', 'Complete your first joint workout', 'users', '#10b981', 'social', 'condition', NULL, NULL, 'common'),
('Social Butterfly', 'Complete 10 joint workouts', 'heart', '#ec4899', 'social', 'total', 10, 'activities', 'rare'),

-- Special badges
('Profile Pro', 'Complete your profile with avatar and personal info', 'user-check', '#6366f1', 'special', 'condition', NULL, NULL, 'common'),
('Staking Starter', 'Make your first token stake', 'coins', '#f59e0b', 'special', 'condition', NULL, NULL, 'rare'),
('Premium Member', 'Upgrade to premium subscription', 'star', '#8b5cf6', 'special', 'condition', NULL, NULL, 'rare'); 
-- Setup script for Level Progression System
-- Run this to install the complete level progression system

\echo 'Setting up Level Progression System...'

-- Source the main level progression functions
\i lib/supabase/sql/create-level-system.sql

\echo 'Level progression functions created successfully!'

-- Test the system with a sample user
\echo 'Testing level progression system...'

-- Create a test user profile if it doesn't exist
INSERT INTO profiles (address, username, email, level) 
VALUES ('test_user_123', 'test_user', 'test@example.com', 1)
ON CONFLICT (address) DO NOTHING;

-- Create some test goals for the user
INSERT INTO goals (address, goal_type, target_value, current_value, unit, category, title, icon, is_active) VALUES
('test_user_123', 'steps', 10000, 0, 'steps', 'daily', 'Daily Steps', 'steps', true),
('test_user_123', 'calories', 2000, 0, 'kcal', 'daily', 'Daily Calories', 'flame', true),
('test_user_123', 'protein', 150, 0, 'g', 'daily', 'Daily Protein', 'beef', true),
('test_user_123', 'fitness', 5, 0, 'workouts', 'weekly', 'Weekly Workouts', 'dumbbell', true),
('test_user_123', 'weight', 70, 70, 'kg', 'monthly', 'Target Weight', 'scale', true)
ON CONFLICT (address, goal_type, category) WHERE is_active = true DO NOTHING;

\echo 'Test goals created.'

-- Test 1: Check initial level progression info
\echo 'Test 1: Initial level progression info'
SELECT 
  current_level,
  daily_goals_completed,
  weekly_goals_completed,
  monthly_goals_completed,
  potential_level_increase,
  next_possible_level
FROM get_level_progression_info('test_user_123');

-- Test 2: Complete daily goals
\echo 'Test 2: Completing daily goals...'
UPDATE goals 
SET current_value = target_value
WHERE address = 'test_user_123' 
  AND category = 'daily' 
  AND is_active = true;

-- Check if daily goals are completed
SELECT check_goals_completed('test_user_123', 'daily') as daily_completed;

-- Test 3: Trigger level check after completing daily goals
\echo 'Test 3: Triggering level check after daily completion...'
SELECT 
  level_increased,
  new_level,
  old_level,
  categories_completed
FROM trigger_level_check('test_user_123');

-- Test 4: Complete weekly goals
\echo 'Test 4: Completing weekly goals...'
UPDATE goals 
SET current_value = target_value
WHERE address = 'test_user_123' 
  AND category = 'weekly' 
  AND is_active = true;

-- Test 5: Trigger another level check
\echo 'Test 5: Triggering level check after weekly completion...'
SELECT 
  level_increased,
  new_level,
  old_level,
  categories_completed
FROM trigger_level_check('test_user_123');

-- Test 6: Check final profile level
\echo 'Test 6: Final profile level check'
SELECT address, level, updated_at 
FROM profiles 
WHERE address = 'test_user_123';

-- Test 7: Reset goals for further testing
\echo 'Test 7: Resetting daily goals for testing...'
SELECT reset_goal_progress('test_user_123', 'daily');

-- Verify reset worked
SELECT goal_type, current_value, target_value
FROM goals 
WHERE address = 'test_user_123' 
  AND category = 'daily' 
  AND is_active = true;

-- Create a function to simulate goal completion and level checking
CREATE OR REPLACE FUNCTION simulate_goal_completion(
  user_address TEXT,
  goal_category TEXT DEFAULT 'daily'
) RETURNS TABLE(
  goals_before_completion INTEGER,
  goals_after_completion INTEGER,
  level_before INTEGER,
  level_after INTEGER,
  level_increased BOOLEAN,
  categories_completed TEXT[]
) AS $$
DECLARE
  initial_level INTEGER;
  final_level INTEGER;
  level_result RECORD;
  goals_before INTEGER;
  goals_after INTEGER;
BEGIN
  -- Get initial state
  SELECT profiles.level INTO initial_level 
  FROM profiles WHERE address = user_address;
  
  SELECT COUNT(*) INTO goals_before
  FROM goals 
  WHERE goals.address = user_address 
    AND category = goal_category 
    AND current_value >= target_value 
    AND is_active = true;
  
  -- Complete all goals in the category
  UPDATE goals 
  SET current_value = target_value
  WHERE goals.address = user_address 
    AND category = goal_category 
    AND is_active = true;
  
  -- Count completed goals after update
  SELECT COUNT(*) INTO goals_after
  FROM goals 
  WHERE goals.address = user_address 
    AND category = goal_category 
    AND current_value >= target_value 
    AND is_active = true;
  
  -- Trigger level check
  SELECT * INTO level_result FROM trigger_level_check(user_address);
  
  -- Get final level
  SELECT profiles.level INTO final_level 
  FROM profiles WHERE address = user_address;
  
  RETURN QUERY SELECT 
    goals_before,
    goals_after,
    initial_level,
    final_level,
    level_result.level_increased,
    level_result.categories_completed;
END;
$$ LANGUAGE plpgsql;

\echo 'Level progression system setup complete!'
\echo ''
\echo 'Usage Examples:'
\echo '  -- Check user level info:'
\echo '  SELECT * FROM get_level_progression_info(''user_address'');'
\echo ''
\echo '  -- Manually trigger level check:'
\echo '  SELECT * FROM trigger_level_check(''user_address'');'
\echo ''
\echo '  -- Simulate completing daily goals:'
\echo '  SELECT * FROM simulate_goal_completion(''user_address'', ''daily'');'
\echo ''
\echo '  -- Reset goals for testing:'
\echo '  SELECT reset_goal_progress(''user_address'', ''daily'');'
\echo ''
\echo 'The system is now ready to automatically increase user levels when they complete their goals!'
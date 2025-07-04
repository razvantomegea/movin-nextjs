-- Level progression system for automatic profile level increases
-- Creates functions and triggers to increase profile level when goals are completed

-- Function to check if all goals in a category are completed for a user
CREATE OR REPLACE FUNCTION check_goals_completed(
  user_address TEXT,
  goal_category TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  total_goals INTEGER;
  completed_goals INTEGER;
BEGIN
  -- Count total active goals in the category
  SELECT COUNT(*) INTO total_goals
  FROM goals
  WHERE address = user_address
    AND category = goal_category
    AND is_active = true;
  
  -- If no goals exist, return false
  IF total_goals = 0 THEN
    RETURN false;
  END IF;
  
  -- Count completed goals (current_value >= target_value)
  SELECT COUNT(*) INTO completed_goals
  FROM goals
  WHERE address = user_address
    AND category = goal_category
    AND is_active = true
    AND current_value >= target_value;
  
  -- Return true if all goals are completed
  RETURN completed_goals = total_goals;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate level increase based on completed goal categories
CREATE OR REPLACE FUNCTION calculate_level_increase(
  daily_completed BOOLEAN,
  weekly_completed BOOLEAN,
  monthly_completed BOOLEAN
) RETURNS INTEGER AS $$
BEGIN
  -- Level increase logic:
  -- Daily goals completed: +1 level
  -- Weekly goals completed: +2 levels
  -- Monthly goals completed: +5 levels
  -- Multiple categories can be completed simultaneously
  
  RETURN 
    CASE WHEN daily_completed THEN 1 ELSE 0 END +
    CASE WHEN weekly_completed THEN 2 ELSE 0 END +
    CASE WHEN monthly_completed THEN 5 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile level when goals are completed
CREATE OR REPLACE FUNCTION update_profile_level(user_address TEXT)
RETURNS TABLE(
  level_increased BOOLEAN,
  new_level INTEGER,
  categories_completed TEXT[]
) AS $$
DECLARE
  current_level INTEGER;
  daily_completed BOOLEAN;
  weekly_completed BOOLEAN;
  monthly_completed BOOLEAN;
  level_increase INTEGER;
  new_level_value INTEGER;
  completed_categories TEXT[] := '{}';
  last_level_update TIMESTAMP;
  current_date_start TIMESTAMP;
BEGIN
  -- Get current profile level and last level update
  SELECT level, COALESCE(updated_at, created_at) INTO current_level, last_level_update
  FROM profiles
  WHERE address = user_address;
  
  -- If no profile found, return with no increase
  IF current_level IS NULL THEN
    RETURN QUERY SELECT false, 0, completed_categories;
    RETURN;
  END IF;
  
  -- Check if we already updated level today to prevent multiple updates
  current_date_start := DATE_TRUNC('day', NOW());
  IF last_level_update >= current_date_start THEN
    RETURN QUERY SELECT false, current_level, completed_categories;
    RETURN;
  END IF;
  
  -- Check completion status for each category
  daily_completed := check_goals_completed(user_address, 'daily');
  weekly_completed := check_goals_completed(user_address, 'weekly');
  monthly_completed := check_goals_completed(user_address, 'monthly');
  
  -- Build completed categories array
  IF daily_completed THEN
    completed_categories := array_append(completed_categories, 'daily');
  END IF;
  IF weekly_completed THEN
    completed_categories := array_append(completed_categories, 'weekly');
  END IF;
  IF monthly_completed THEN
    completed_categories := array_append(completed_categories, 'monthly');
  END IF;
  
  -- Calculate level increase
  level_increase := calculate_level_increase(daily_completed, weekly_completed, monthly_completed);
  
  -- If no level increase, return current state
  IF level_increase = 0 THEN
    RETURN QUERY SELECT false, current_level, completed_categories;
    RETURN;
  END IF;
  
  -- Calculate new level
  new_level_value := current_level + level_increase;
  
  -- Update profile level
  UPDATE profiles
  SET 
    level = new_level_value,
    updated_at = NOW()
  WHERE address = user_address;
  
  -- Return success with new level
  RETURN QUERY SELECT true, new_level_value, completed_categories;
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger level check (can be called from application)
CREATE OR REPLACE FUNCTION trigger_level_check(user_address TEXT)
RETURNS TABLE(
  level_increased BOOLEAN,
  new_level INTEGER,
  old_level INTEGER,
  categories_completed TEXT[]
) AS $$
DECLARE
  old_level_value INTEGER;
  result_record RECORD;
BEGIN
  -- Get current level
  SELECT level INTO old_level_value
  FROM profiles
  WHERE address = user_address;
  
  -- Update profile level
  SELECT * INTO result_record
  FROM update_profile_level(user_address);
  
  -- Return comprehensive result
  RETURN QUERY SELECT 
    result_record.level_increased,
    result_record.new_level,
    old_level_value,
    result_record.categories_completed;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically check levels when goals are updated
CREATE OR REPLACE FUNCTION trigger_level_check_on_goal_update()
RETURNS TRIGGER AS $$
DECLARE
  level_result RECORD;
BEGIN
  -- Only trigger if current_value changed and goal might be completed
  IF OLD.current_value != NEW.current_value THEN
    -- Check if goal is now completed
    IF NEW.current_value >= NEW.target_value AND OLD.current_value < OLD.target_value THEN
      -- Goal just got completed, check for level up
      SELECT * INTO level_result
      FROM update_profile_level(NEW.address);
      
      -- Log level increase (optional - you could insert into a level_logs table)
      IF level_result.level_increased THEN
        RAISE NOTICE 'User % leveled up to level % by completing % goals',
          NEW.address, level_result.new_level, level_result.categories_completed;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic level checks when goals are updated
DROP TRIGGER IF EXISTS auto_level_check_on_goal_update ON goals;
CREATE TRIGGER auto_level_check_on_goal_update
  AFTER UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_level_check_on_goal_update();

-- Function to reset daily/weekly/monthly goal progress (useful for scheduled jobs)
CREATE OR REPLACE FUNCTION reset_goal_progress(
  user_address TEXT,
  goal_category TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE goals
  SET 
    current_value = 0,
    updated_at = NOW()
  WHERE address = user_address
    AND category = goal_category
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get level progression info for a user
CREATE OR REPLACE FUNCTION get_level_progression_info(user_address TEXT)
RETURNS TABLE(
  current_level INTEGER,
  daily_goals_completed BOOLEAN,
  weekly_goals_completed BOOLEAN,
  monthly_goals_completed BOOLEAN,
  potential_level_increase INTEGER,
  next_possible_level INTEGER
) AS $$
DECLARE
  user_level INTEGER;
  daily_complete BOOLEAN;
  weekly_complete BOOLEAN;
  monthly_complete BOOLEAN;
  level_increase INTEGER;
BEGIN
  -- Get current level
  SELECT level INTO user_level
  FROM profiles
  WHERE address = user_address;
  
  -- Check goal completion status
  daily_complete := check_goals_completed(user_address, 'daily');
  weekly_complete := check_goals_completed(user_address, 'weekly');
  monthly_complete := check_goals_completed(user_address, 'monthly');
  
  -- Calculate potential level increase
  level_increase := calculate_level_increase(daily_complete, weekly_complete, monthly_complete);
  
  RETURN QUERY SELECT
    user_level,
    daily_complete,
    weekly_complete,
    monthly_complete,
    level_increase,
    user_level + level_increase;
END;
$$ LANGUAGE plpgsql;
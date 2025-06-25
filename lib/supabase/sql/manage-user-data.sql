-- MANAGE USER DATA
-- This script contains functions for exporting, importing, and deleting user data.

-- Function to export all user data as a single JSONB object
CREATE OR REPLACE FUNCTION export_user_data(user_address TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  profile_data JSONB;
  activities_data JSONB;
  rewards_data JSONB;
  badges_data JSONB;
  staking_data JSONB;
  meals_data JSONB;
  energy_data JSONB;
BEGIN
  -- Security check: ensure user can only export their own data
  IF (auth.jwt() ->> 'sub') != user_address THEN
    RAISE EXCEPTION 'Unauthorized: You can only export your own data';
  END IF;

  SELECT to_jsonb(p) INTO profile_data FROM profiles p WHERE p.address = user_address;
  SELECT jsonb_agg(to_jsonb(a)) INTO activities_data FROM activities a WHERE a.address = user_address;
  SELECT jsonb_agg(to_jsonb(ar)) INTO rewards_data FROM activity_rewards ar WHERE ar.address = user_address;
  SELECT jsonb_agg(to_jsonb(ub)) INTO badges_data FROM user_badges ub WHERE ub.address = user_address;
  SELECT jsonb_agg(to_jsonb(s)) INTO staking_data FROM staking s WHERE s.address = user_address;
  SELECT jsonb_agg(to_jsonb(m)) INTO meals_data FROM meals m WHERE m.address = user_address;
  SELECT jsonb_agg(to_jsonb(e)) INTO energy_data FROM energy e WHERE e.address = user_address;

  result := jsonb_build_object(
    'profile', COALESCE(profile_data, '{}'::jsonb),
    'activities', COALESCE(activities_data, '[]'::jsonb),
    'activity_rewards', COALESCE(rewards_data, '[]'::jsonb),
    'user_badges', COALESCE(badges_data, '[]'::jsonb),
    'staking', COALESCE(staking_data, '[]'::jsonb),
    'meals', COALESCE(meals_data, '[]'::jsonb),
    'energy', COALESCE(energy_data, '[]'::jsonb)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to import user data from a JSONB object
CREATE OR REPLACE FUNCTION import_user_data(user_address TEXT, import_data JSONB)
RETURNS VOID AS $$
DECLARE
  item JSONB;
BEGIN
  -- Security check: ensure user can only import their own data
  IF (auth.jwt() ->> 'sub') != user_address THEN
    RAISE EXCEPTION 'Unauthorized: You can only import data for your own account';
  END IF;

  -- Clear existing data
  DELETE FROM activities WHERE address = user_address;
  DELETE FROM activity_rewards WHERE address = user_address;
  DELETE FROM user_badges WHERE address = user_address;
  DELETE FROM staking WHERE address = user_address;
  DELETE FROM meals WHERE address = user_address;
  DELETE FROM energy WHERE address = user_address;
  -- We don't delete the profile, we update it.

  -- Import profile
  IF jsonb_typeof(import_data -> 'profile') = 'object' AND (import_data -> 'profile' ->> 'address') IS NOT NULL THEN
    UPDATE profiles SET
      username = import_data -> 'profile' ->> 'username',
      email = import_data -> 'profile' ->> 'email',
      avatar_url = import_data -> 'profile' ->> 'avatar_url',
      bio = import_data -> 'profile' ->> 'bio',
      website = import_data -> 'profile' ->> 'website',
      level = COALESCE((import_data -> 'profile' ->> 'level')::INTEGER, level),
      streak_days = COALESCE((import_data -> 'profile' ->> 'streak_days')::INTEGER, streak_days),
      last_streak_update = COALESCE((import_data -> 'profile' ->> 'last_streak_update')::TIMESTAMPTZ, last_streak_update),
      is_premium = COALESCE((import_data -> 'profile' ->> 'is_premium')::BOOLEAN, is_premium),
      weight = COALESCE((import_data -> 'profile' ->> 'weight')::DECIMAL, weight),
      weight_unit = COALESCE(import_data -> 'profile' ->> 'weight_unit', weight_unit),
      weight_updated_at = COALESCE((import_data -> 'profile' ->> 'weight_updated_at')::TIMESTAMPTZ, weight_updated_at),
      height = COALESCE((import_data -> 'profile' ->> 'height')::DECIMAL, height),
      date_of_birth = COALESCE(import_data -> 'profile' ->> 'date_of_birth', date_of_birth),
      biological_sex = COALESCE(import_data -> 'profile' ->> 'biological_sex', biological_sex),
      created_at = COALESCE((import_data -> 'profile' ->> 'created_at')::TIMESTAMPTZ, created_at, now()),
      updated_at = now()
    WHERE address = user_address;
  END IF;

  -- Import activities
  FOR item IN SELECT * FROM jsonb_array_elements(import_data -> 'activities')
  LOOP
    INSERT INTO activities (id, address, type, distance, calories, steps, points, created_at)
    VALUES (
      (item ->> 'id')::UUID,
      user_address,
      item ->> 'type',
      (item ->> 'distance')::DECIMAL,
      (item ->> 'calories')::INTEGER,
      (item ->> 'steps')::INTEGER,
      (item ->> 'points')::INTEGER,
      (item ->> 'created_at')::TIMESTAMPTZ
    );
  END LOOP;

  -- Import activity_rewards
  FOR item IN SELECT * FROM jsonb_array_elements(import_data -> 'activity_rewards')
  LOOP
    INSERT INTO activity_rewards (id, address, activity_id, rewards, created_at)
    VALUES (
      (item ->> 'id')::UUID,
      user_address,
      (item ->> 'activity_id')::UUID,
      (item ->> 'rewards')::DECIMAL,
      (item ->> 'created_at')::TIMESTAMPTZ
    );
  END LOOP;

  -- Import user_badges
  FOR item IN SELECT * FROM jsonb_array_elements(import_data -> 'user_badges')
  LOOP
    INSERT INTO user_badges (id, address, badge_id, created_at)
    VALUES (
      (item ->> 'id')::UUID,
      user_address,
      item ->> 'badge_id',
      (item ->> 'created_at')::TIMESTAMPTZ
    );
  END LOOP;

  -- Import staking
  FOR item IN SELECT * FROM jsonb_array_elements(import_data -> 'staking')
  LOOP
    INSERT INTO staking (id, address, amount, lock_period_days, start_date, end_date, is_active, created_at)
    VALUES (
      (item ->> 'id')::UUID,
      user_address,
      (item ->> 'amount')::DECIMAL,
      (item ->> 'lock_period_days')::INTEGER,
      (item ->> 'start_date')::TIMESTAMPTZ,
      (item ->> 'end_date')::TIMESTAMPTZ,
      (item ->> 'is_active')::BOOLEAN,
      (item ->> 'created_at')::TIMESTAMPTZ
    );
  END LOOP;

  -- Import meals
  FOR item IN SELECT * FROM jsonb_array_elements(import_data -> 'meals')
  LOOP
    INSERT INTO meals (id, address, calories, protein, carbohydrates, fats, fiber, log_date, meal_name, created_at, updated_at)
    VALUES (
      (item ->> 'id')::UUID,
      user_address,
      (item ->> 'calories')::INTEGER,
      (item ->> 'protein')::DECIMAL,
      (item ->> 'carbohydrates')::DECIMAL,
      (item ->> 'fats')::DECIMAL,
      (item ->> 'fiber')::DECIMAL,
      (item ->> 'log_date')::DATE,
      item ->> 'meal_name',
      (item ->> 'created_at')::TIMESTAMPTZ,
      (item ->> 'updated_at')::TIMESTAMPTZ
    );
  END LOOP;

  -- Import energy
  FOR item IN SELECT * FROM jsonb_array_elements(import_data -> 'energy')
  LOOP
    INSERT INTO energy (id, address, calories, protein, carbohydrates, fats, fiber, log_date, meal_name, created_at, updated_at)
    VALUES (
      (item ->> 'id')::UUID,
      user_address,
      (item ->> 'calories')::INTEGER,
      (item ->> 'protein')::DECIMAL,
      (item ->> 'carbohydrates')::DECIMAL,
      (item ->> 'fats')::DECIMAL,
      (item ->> 'fiber')::DECIMAL,
      (item ->> 'log_date')::DATE,
      item ->> 'meal_name',
      (item ->> 'created_at')::TIMESTAMPTZ,
      (item ->> 'updated_at')::TIMESTAMPTZ
    );
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get user data summary before deletion
CREATE OR REPLACE FUNCTION get_user_data_summary(user_address TEXT)
RETURNS JSONB AS $$
DECLARE
  summary JSONB;
  activities_count INTEGER;
  rewards_count INTEGER;
  badges_count INTEGER;
  stakes_count INTEGER;
  meals_count INTEGER;
  energy_count INTEGER;
  total_rewards DECIMAL;
  total_staked DECIMAL;
  profile_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE address = user_address) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN jsonb_build_object(
      'exists', false,
      'summary', jsonb_build_object()
    );
  END IF;

  -- Count all user data
  SELECT COUNT(*) INTO activities_count FROM activities WHERE address = user_address;
  SELECT COUNT(*) INTO rewards_count FROM activity_rewards WHERE address = user_address;
  SELECT COUNT(*) INTO badges_count FROM user_badges WHERE address = user_address;
  SELECT COUNT(*) INTO stakes_count FROM staking WHERE address = user_address;
  SELECT COUNT(*) INTO meals_count FROM meals WHERE address = user_address;
  SELECT COUNT(*) INTO energy_count FROM energy WHERE address = user_address;
  
  -- Calculate totals
  SELECT COALESCE(SUM(rewards), 0) INTO total_rewards FROM activity_rewards WHERE address = user_address;
  SELECT COALESCE(SUM(amount), 0) INTO total_staked FROM staking WHERE address = user_address AND is_active = true;

  -- Build summary
  summary := jsonb_build_object(
    'activities', activities_count,
    'activity_rewards', rewards_count,
    'user_badges', badges_count,
    'staking', stakes_count,
    'meals', meals_count,
    'energy', energy_count,
    'total_rewards', total_rewards,
    'total_staked', total_staked
  );

  RETURN jsonb_build_object(
    'exists', true,
    'summary', summary
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to safely delete all user data
CREATE OR REPLACE FUNCTION delete_all_user_data(user_address TEXT)
RETURNS JSONB AS $$
DECLARE
  deleted_counts JSONB;
  activities_count INTEGER;
  rewards_count INTEGER;
  badges_count INTEGER;
  stakes_count INTEGER;
  meals_count INTEGER;
  energy_count INTEGER;
  profile_exists BOOLEAN;
  current_user_address TEXT;
BEGIN
  -- Security check: ensure user can only delete their own data
  current_user_address := auth.jwt() ->> 'sub';
  
  IF current_user_address != user_address THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: You can only delete your own data',
      'deleted_counts', jsonb_build_object()
    );
  END IF;

  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE address = user_address) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'deleted_counts', jsonb_build_object()
    );
  END IF;

  -- Count records before deletion for reporting
  SELECT COUNT(*) INTO activities_count FROM activities WHERE address = user_address;
  SELECT COUNT(*) INTO rewards_count FROM activity_rewards WHERE address = user_address;
  SELECT COUNT(*) INTO badges_count FROM user_badges WHERE address = user_address;
  SELECT COUNT(*) INTO stakes_count FROM staking WHERE address = user_address;
  SELECT COUNT(*) INTO meals_count FROM meals WHERE address = user_address;
  SELECT COUNT(*) INTO energy_count FROM energy WHERE address = user_address;

  -- Delete all user data (order matters for foreign key constraints)
  -- Delete dependent records first, then the profile
  DELETE FROM activities WHERE address = user_address;
  DELETE FROM activity_rewards WHERE address = user_address;
  DELETE FROM user_badges WHERE address = user_address;
  DELETE FROM staking WHERE address = user_address;
  DELETE FROM meals WHERE address = user_address;
  DELETE FROM energy WHERE address = user_address;
  DELETE FROM profiles WHERE address = user_address;

  -- Build the response with deletion counts
  deleted_counts := jsonb_build_object(
    'activities', activities_count,
    'activity_rewards', rewards_count,
    'user_badges', badges_count,
    'staking', stakes_count,
    'meals', meals_count,
    'energy', energy_count,
    'profile', 1
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'All user data successfully deleted',
    'deleted_counts', deleted_counts
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'deleted_counts', jsonb_build_object()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 


-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION export_user_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION import_user_data(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_all_user_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data_summary(TEXT) TO authenticated;

-- Add RLS policies for the functions (they use SECURITY DEFINER so they run with elevated privileges)
-- The functions themselves should validate that the user can only delete their own data 
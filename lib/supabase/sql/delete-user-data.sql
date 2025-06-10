-- Function to safely delete all user data
-- This function will delete all data associated with a user's address
-- Due to CASCADE DELETE constraints, deleting the profile will automatically
-- delete all related data in other tables
-- The secure version with authorization check is defined below

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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION delete_all_user_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data_summary(TEXT) TO authenticated;

-- Add RLS policies for the functions (they use SECURITY DEFINER so they run with elevated privileges)
-- The functions themselves should validate that the user can only delete their own data

-- Add additional security check in the delete function
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
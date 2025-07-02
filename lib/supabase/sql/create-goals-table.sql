-- Create goals table for user fitness and nutrition goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'calories', 'protein', 'carbohydrates', 'fats', 'fiber', 'weight', 'fitness', 'steps', 'mets', 'duration'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('daily', 'weekly', 'monthly')),
  title TEXT NOT NULL,
  icon TEXT DEFAULT 'target',
  auto_trigger BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_address ON goals(address);
CREATE INDEX IF NOT EXISTS idx_goals_address_active ON goals(address, is_active);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_address_category ON goals(address, category);

-- Create unique constraint to prevent duplicate goals of same type for same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_address_type_category 
ON goals(address, goal_type, category) WHERE is_active = true;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_timestamp_goals
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Function to calculate BMR using Mifflin-St Jeor Equation
CREATE OR REPLACE FUNCTION calculate_bmr(
  weight_kg NUMERIC,
  height_cm NUMERIC,
  age_years INTEGER,
  biological_sex TEXT
) RETURNS NUMERIC AS $$
BEGIN
  IF weight_kg IS NULL OR height_cm IS NULL OR age_years IS NULL OR biological_sex IS NULL THEN
    RETURN 1800; -- Default BMR
  END IF;
  
  IF biological_sex = 'male' THEN
    RETURN (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5;
  ELSE
    RETURN (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(date_of_birth DATE) RETURNS INTEGER AS $$
BEGIN
  IF date_of_birth IS NULL THEN
    RETURN 30; -- Default age
  END IF;
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate nutrition goals based on weight goal and current weight
CREATE OR REPLACE FUNCTION calculate_nutrition_goals(
  user_address TEXT,
  OUT daily_calories NUMERIC,
  OUT daily_protein NUMERIC,
  OUT daily_fiber NUMERIC,
  OUT daily_fats NUMERIC,
  OUT daily_carbohydrates NUMERIC
) AS $$
DECLARE
  profile_data RECORD;
  weight_goal_data RECORD;
  base_calories NUMERIC;
  calories_from_protein NUMERIC;
  calories_from_fat NUMERIC;
  calories_from_carbs NUMERIC;
  user_age INTEGER;
  bmr NUMERIC;
BEGIN
  -- Get user profile data
  SELECT weight, height, biological_sex, date_of_birth
  INTO profile_data
  FROM profiles
  WHERE address = user_address;
  
  -- Get weight goal
  SELECT target_value
  INTO weight_goal_data
  FROM goals
  WHERE address = user_address 
    AND goal_type = 'weight' 
    AND category = 'monthly' 
    AND is_active = true
  LIMIT 1;
  
  -- Use current weight if no weight goal is set
  IF weight_goal_data.target_value IS NULL THEN
    weight_goal_data.target_value := profile_data.weight;
  END IF;
  
  -- Calculate age
  user_age := calculate_age(profile_data.date_of_birth);
  
  -- Calculate BMR
  bmr := calculate_bmr(
    profile_data.weight, 
    profile_data.height, 
    user_age, 
    profile_data.biological_sex
  );
  
  -- Base calories with activity factor (lightly active = 1.2)
  base_calories := bmr;
  
  -- Adjust calories based on weight goal vs current weight
  IF weight_goal_data.target_value > profile_data.weight THEN
    -- Weight gain: increase calories by 10%
    daily_calories := base_calories * 1.1;
  ELSIF weight_goal_data.target_value < profile_data.weight THEN
    -- Weight loss: decrease calories by 10%
    daily_calories := base_calories * 0.9;
  ELSE
    -- Maintain weight
    daily_calories := base_calories;
  END IF;
  
  -- Calculate macronutrients based on current weight
  daily_protein := profile_data.weight * 2.0; -- 2g per kg
  daily_fiber := profile_data.weight * 0.5; -- 0.5g per kg
  daily_fats := profile_data.weight * 1.0; -- 1g per kg
  
  -- Add calories burned from today's activities BEFORE calculating carbs
  DECLARE
    calories_burned_today NUMERIC;
  BEGIN
    SELECT COALESCE(SUM(total_energy_burned), 0) INTO calories_burned_today
    FROM activities
    WHERE address = user_address
      AND DATE(start_date) = CURRENT_DATE;
    daily_calories := daily_calories + calories_burned_today;
  END;
  
  -- Calculate carbohydrates based on remaining calories
  calories_from_protein := daily_protein * 4; -- 4 kcal per gram
  calories_from_fat := daily_fats * 9; -- 9 kcal per gram
  calories_from_carbs := daily_calories - calories_from_protein - calories_from_fat;
  
  -- Convert carb calories to grams (4 kcal per gram)
  daily_carbohydrates := GREATEST(0, calories_from_carbs / 4);
  
  -- Ensure all values are positive and reasonable
  daily_calories := GREATEST(1200, daily_calories);
  daily_protein := GREATEST(50, daily_protein);
  daily_fiber := GREATEST(25, daily_fiber);
  daily_fats := GREATEST(30, daily_fats);
  daily_carbohydrates := GREATEST(100, daily_carbohydrates);
END;
$$ LANGUAGE plpgsql;

-- Function to update nutrition goals automatically
CREATE OR REPLACE FUNCTION update_nutrition_goals(user_address TEXT)
RETURNS VOID AS $$
DECLARE
  nutrition_goals RECORD;
BEGIN
  -- Calculate new nutrition goals
  SELECT * INTO nutrition_goals FROM calculate_nutrition_goals(user_address);
  
  -- Update or insert calories goal
  INSERT INTO goals (address, goal_type, target_value, unit, category, title, icon, auto_trigger)
  VALUES (user_address, 'calories', nutrition_goals.daily_calories, 'kcal', 'daily', 'Daily Calories Intake', 'flame', true)
  ON CONFLICT (address, goal_type, category) WHERE is_active = true
  DO UPDATE SET 
    target_value = nutrition_goals.daily_calories,
    updated_at = NOW();
  
  -- Update or insert protein goal
  INSERT INTO goals (address, goal_type, target_value, unit, category, title, icon, auto_trigger)
  VALUES (user_address, 'protein', nutrition_goals.daily_protein, 'g', 'daily', 'Daily Protein', 'beef', true)
  ON CONFLICT (address, goal_type, category) WHERE is_active = true
  DO UPDATE SET 
    target_value = nutrition_goals.daily_protein,
    updated_at = NOW();
  
  -- Update or insert fiber goal
  INSERT INTO goals (address, goal_type, target_value, unit, category, title, icon, auto_trigger)
  VALUES (user_address, 'fiber', nutrition_goals.daily_fiber, 'g', 'daily', 'Daily Fiber', 'fiber', true)
  ON CONFLICT (address, goal_type, category) WHERE is_active = true
  DO UPDATE SET 
    target_value = nutrition_goals.daily_fiber,
    updated_at = NOW();
  
  -- Update or insert fats goal
  INSERT INTO goals (address, goal_type, target_value, unit, category, title, icon, auto_trigger)
  VALUES (user_address, 'fats', nutrition_goals.daily_fats, 'g', 'daily', 'Daily Fats', 'droplet', true)
  ON CONFLICT (address, goal_type, category) WHERE is_active = true
  DO UPDATE SET 
    target_value = nutrition_goals.daily_fats,
    updated_at = NOW();
  
  -- Update or insert carbohydrates goal
  INSERT INTO goals (address, goal_type, target_value, unit, category, title, icon, auto_trigger)
  VALUES (user_address, 'carbohydrates', nutrition_goals.daily_carbohydrates, 'g', 'daily', 'Daily Carbohydrates', 'wheat', true)
  ON CONFLICT (address, goal_type, category) WHERE is_active = true
  DO UPDATE SET 
    target_value = nutrition_goals.daily_carbohydrates,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to trigger nutrition goals update when weight goal changes
CREATE OR REPLACE FUNCTION trigger_nutrition_goals_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If weight goal is updated, recalculate nutrition goals
  IF NEW.goal_type = 'weight' AND (OLD.target_value != NEW.target_value OR OLD IS NULL) THEN
    PERFORM update_nutrition_goals(NEW.address);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic nutrition goals update
CREATE OR REPLACE TRIGGER update_nutrition_goals_on_weight_change
AFTER INSERT OR UPDATE ON goals
FOR EACH ROW
EXECUTE PROCEDURE trigger_nutrition_goals_update();

-- Function to trigger nutrition goals update when profile weight changes
CREATE OR REPLACE FUNCTION trigger_nutrition_goals_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If weight is updated, recalculate nutrition goals
  IF OLD.weight != NEW.weight OR OLD.weight IS NULL THEN
    PERFORM update_nutrition_goals(NEW.address);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic nutrition goals update when profile weight changes
CREATE OR REPLACE TRIGGER update_nutrition_goals_on_profile_weight_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE trigger_nutrition_goals_on_profile_update();

-- Insert default goals for new users (can be called via function)
CREATE OR REPLACE FUNCTION create_default_goals(user_address TEXT)
RETURNS VOID AS $$
BEGIN
  -- Daily goals
  INSERT INTO goals (address, goal_type, target_value, unit, category, title, icon, auto_trigger) VALUES
  (user_address, 'steps', 10000, 'steps', 'daily', 'Daily Steps', 'steps', false),
  (user_address, 'duration', 30, 'min', 'daily', 'Active Minutes', 'clock', true),
  
  -- Weekly goals
  (user_address, 'fitness', 5, 'workouts', 'weekly', 'Weekly Workouts', 'dumbbell', true),
  (user_address, 'mets', 150, 'METs', 'weekly', 'Weekly METs', 'activity', false),
  
  -- Monthly goals (weight goal will trigger nutrition goals calculation)
  (user_address, 'weight', 70, 'kg', 'monthly', 'Target Weight', 'scale', false)
  
  ON CONFLICT (address, goal_type, category) WHERE is_active = true
  DO NOTHING; -- Don't overwrite existing goals
  
  -- Calculate and insert nutrition goals based on weight goal
  PERFORM update_nutrition_goals(user_address);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate current progress for goals
CREATE OR REPLACE FUNCTION update_goal_progress(user_address TEXT, goal_category TEXT DEFAULT 'daily')
RETURNS VOID AS $$
DECLARE
  goal_record RECORD;
  current_val NUMERIC;
  date_filter_start DATE;
  date_filter_end DATE;
BEGIN
  -- Set date filters based on category
  CASE goal_category
    WHEN 'daily' THEN
      date_filter_start := CURRENT_DATE;
      date_filter_end := CURRENT_DATE;
    WHEN 'weekly' THEN
      date_filter_start := DATE_TRUNC('week', CURRENT_DATE);
      date_filter_end := DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days';
    WHEN 'monthly' THEN
      date_filter_start := DATE_TRUNC('month', CURRENT_DATE);
      date_filter_end := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
  END CASE;

  -- Loop through all active goals for the user in the specified category
  FOR goal_record IN 
    SELECT * FROM goals 
    WHERE address = user_address 
    AND category = goal_category 
    AND is_active = true
  LOOP
    current_val := 0;
    
    -- Calculate current value based on goal type
    CASE goal_record.goal_type
      WHEN 'steps' THEN
        SELECT COALESCE(SUM(total_steps), 0) INTO current_val
        FROM activities 
        WHERE address = user_address 
        AND DATE(start_date) BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'calories' THEN
        SELECT COALESCE(SUM(calories), 0) INTO current_val
        FROM energy
        WHERE address = user_address
          AND log_date BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'protein' THEN
        SELECT COALESCE(SUM(protein), 0) INTO current_val
        FROM energy 
        WHERE address = user_address 
        AND log_date BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'carbohydrates' THEN
        SELECT COALESCE(SUM(carbohydrates), 0) INTO current_val
        FROM energy 
        WHERE address = user_address 
        AND log_date BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'fats' THEN
        SELECT COALESCE(SUM(fats), 0) INTO current_val
        FROM energy 
        WHERE address = user_address 
        AND log_date BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'fiber' THEN
        SELECT COALESCE(SUM(fiber), 0) INTO current_val
        FROM energy 
        WHERE address = user_address 
        AND log_date BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'duration' THEN
        -- Active minutes from activities
        SELECT COALESCE(SUM(duration), 0) / 60 INTO current_val
        FROM activities 
        WHERE address = user_address 
        AND DATE(start_date) BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'fitness' THEN
        -- Count of workouts (activities that are not just steps)
        SELECT COUNT(*) INTO current_val
        FROM activities 
        WHERE address = user_address 
        AND DATE(start_date) BETWEEN date_filter_start AND date_filter_end
        AND name != 'Steps';
        
      WHEN 'mets' THEN
        -- This would need a more complex calculation based on activity intensity
        -- For now, we'll use a simple sum if we add a mets field to activities
        SELECT COALESCE(COUNT(*) * 5, 0) INTO current_val
        FROM activities 
        WHERE address = user_address 
        AND DATE(start_date) BETWEEN date_filter_start AND date_filter_end;
        
      WHEN 'weight' THEN
        -- Get the latest weight from profile
        SELECT COALESCE(weight, 0) INTO current_val
        FROM profiles 
        WHERE address = user_address;
        
      ELSE
        current_val := 0;
    END CASE;
    
    -- Update the goal with the calculated current value
    UPDATE goals 
    SET current_value = current_val, updated_at = NOW()
    WHERE id = goal_record.id;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql; 

-- Create policy for goals table
-- READ Policy
create policy "Allow address-based read"
on goals
for select
to authenticated
using ( (auth.jwt() ->> 'sub') = address );


-- INSERT Policy
create policy "Allow address-based insert"
on goals
for insert
to authenticated
with check ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
create policy "Allow address-based update"
on goals
for update
to authenticated
using ( (auth.jwt() ->> 'sub') = address )
with check ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
create policy "Allow address-based delete"
on goals
for delete
to authenticated
using ( (auth.jwt() ->> 'sub') = address );

-- Function to trigger nutrition goals update when activities change
CREATE OR REPLACE FUNCTION trigger_nutrition_goals_on_activity_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate nutrition goals for the user
  PERFORM update_nutrition_goals(NEW.address);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic nutrition goals update when activities are inserted/updated
CREATE OR REPLACE TRIGGER update_nutrition_goals_on_activity_change
AFTER INSERT OR UPDATE ON activities
FOR EACH ROW
EXECUTE PROCEDURE trigger_nutrition_goals_on_activity_change();

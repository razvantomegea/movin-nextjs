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

CREATE TRIGGER set_timestamp_goals
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert default goals for new users (can be called via function)
CREATE OR REPLACE FUNCTION create_default_goals(user_address TEXT)
RETURNS VOID AS $$
BEGIN
  -- Daily goals
  INSERT INTO goals (address, goal_type, target_value, unit, category, title, icon, auto_trigger) VALUES
  (user_address, 'steps', 10000, 'steps', 'daily', 'Daily Steps', 'steps', false),
  (user_address, 'calories', 2000, 'kcal', 'daily', 'Daily Calories Intake', 'flame', false),
  (user_address, 'protein', 50, 'g', 'daily', 'Daily Protein', 'beef', false),
  (user_address, 'fiber', 25, 'g', 'daily', 'Daily Fiber', 'fiber', false),
  (user_address, 'duration', 30, 'min', 'daily', 'Active Minutes', 'clock', true),
  
  -- Weekly goals
  (user_address, 'fitness', 5, 'workouts', 'weekly', 'Weekly Workouts', 'dumbbell', true),
  (user_address, 'mets', 150, 'METs', 'weekly', 'Weekly METs', 'activity', false),
  
  -- Monthly goals (optional)
  (user_address, 'weight', 70, 'kg', 'monthly', 'Target Weight', 'scale', false)
  
  ON CONFLICT (address, goal_type, category) WHERE is_active = true
  DO NOTHING; -- Don't overwrite existing goals
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
        -- For calories intake (from energy table)
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

-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_volume DECIMAL(10,2) DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 1,
    reps INTEGER NOT NULL DEFAULT 1,
    weight DECIMAL(8,2) DEFAULT 0,
    time_under_tension INTEGER DEFAULT 0, -- in seconds
    exercise_duration INTEGER DEFAULT 0, -- in seconds
    rest_time INTEGER DEFAULT 0, -- in seconds between sets
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_sets INTEGER DEFAULT 0
);

-- Create exercise_sets table (NEW)
CREATE TABLE IF NOT EXISTS public.exercise_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER NOT NULL DEFAULT 1,
    weight DECIMAL(8,2) DEFAULT 0,
    duration INTEGER DEFAULT 0, -- in seconds
    time_under_tension INTEGER DEFAULT 0, -- in seconds
    rest_time INTEGER DEFAULT 0, -- in seconds
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add CHECK constraints for data integrity
ALTER TABLE public.workout_exercises
    ADD CONSTRAINT chk_sets_positive CHECK (sets > 0),
    ADD CONSTRAINT chk_reps_positive CHECK (reps > 0),
    ADD CONSTRAINT chk_weight_nonnegative CHECK (weight >= 0),
    ADD CONSTRAINT chk_completed_sets_nonnegative CHECK (completed_sets >= 0);

-- Add CHECK constraints for exercise_sets
ALTER TABLE public.exercise_sets
    ADD CONSTRAINT chk_exercise_set_number_positive CHECK (set_number > 0),
    ADD CONSTRAINT chk_exercise_reps_positive CHECK (reps > 0),
    ADD CONSTRAINT chk_exercise_weight_nonnegative CHECK (weight >= 0),
    ADD CONSTRAINT chk_exercise_duration_nonnegative CHECK (duration >= 0),
    ADD CONSTRAINT chk_exercise_time_under_tension_nonnegative CHECK (time_under_tension >= 0),
    ADD CONSTRAINT chk_exercise_rest_time_nonnegative CHECK (rest_time >= 0);

-- Add UNIQUE constraint to prevent duplicate exercises in the same workout
ALTER TABLE public.workout_exercises
    ADD CONSTRAINT unique_workout_exercise_name UNIQUE (workout_id, exercise_name);

-- Add UNIQUE constraint to prevent duplicate set numbers for the same exercise
ALTER TABLE public.exercise_sets
    ADD CONSTRAINT unique_exercise_set_number UNIQUE (exercise_id, set_number);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workouts_address ON public.workouts(address);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(workout_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise_id ON public.exercise_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_address ON public.exercise_sets(address);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_order ON public.exercise_sets(exercise_id, set_number);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

-- Function to automatically update total_volume and total_duration when exercises change
CREATE OR REPLACE FUNCTION update_workout_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.workouts 
    SET 
        total_volume = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN (SELECT COUNT(*) FROM public.exercise_sets WHERE exercise_id = we.id) > 0
                    THEN (SELECT SUM(es.reps * es.weight) FROM public.exercise_sets es WHERE es.exercise_id = we.id)
                    ELSE we.sets * we.reps * we.weight
                END
            ), 0)
            FROM public.workout_exercises we
            WHERE we.workout_id = COALESCE(NEW.workout_id, OLD.workout_id)
        ),
        total_duration = (
            SELECT COALESCE(SUM(exercise_duration), 0)
            FROM public.workout_exercises 
            WHERE workout_id = COALESCE(NEW.workout_id, OLD.workout_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.workout_id, OLD.workout_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update exercise summary when sets change
CREATE OR REPLACE FUNCTION update_exercise_summary()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.workout_exercises 
    SET 
        sets = (
            SELECT COUNT(*)
            FROM public.exercise_sets 
            WHERE exercise_id = COALESCE(NEW.exercise_id, OLD.exercise_id)
        ),
        reps = (
            SELECT COALESCE(SUM(reps), 0)
            FROM public.exercise_sets 
            WHERE exercise_id = COALESCE(NEW.exercise_id, OLD.exercise_id)
        ),
        weight = (
            SELECT COALESCE(AVG(weight), 0)
            FROM public.exercise_sets 
            WHERE exercise_id = COALESCE(NEW.exercise_id, OLD.exercise_id)
        ),
        exercise_duration = (
            SELECT COALESCE(SUM(duration), 0)
            FROM public.exercise_sets 
            WHERE exercise_id = COALESCE(NEW.exercise_id, OLD.exercise_id)
        ),
        time_under_tension = (
            SELECT COALESCE(SUM(time_under_tension), 0)
            FROM public.exercise_sets 
            WHERE exercise_id = COALESCE(NEW.exercise_id, OLD.exercise_id)
        ),
        rest_time = (
            SELECT COALESCE(AVG(rest_time), 0)
            FROM public.exercise_sets 
            WHERE exercise_id = COALESCE(NEW.exercise_id, OLD.exercise_id)
        ),
        completed_sets = (
            SELECT COUNT(*)
            FROM public.exercise_sets 
            WHERE exercise_id = COALESCE(NEW.exercise_id, OLD.exercise_id) AND completed = TRUE
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.exercise_id, OLD.exercise_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update workout totals
DROP TRIGGER IF EXISTS trigger_update_workout_totals_insert ON public.workout_exercises;
CREATE TRIGGER trigger_update_workout_totals_insert
    AFTER INSERT ON public.workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_totals();

DROP TRIGGER IF EXISTS trigger_update_workout_totals_update ON public.workout_exercises;
CREATE TRIGGER trigger_update_workout_totals_update
    AFTER UPDATE ON public.workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_totals();

DROP TRIGGER IF EXISTS trigger_update_workout_totals_delete ON public.workout_exercises;
CREATE TRIGGER trigger_update_workout_totals_delete
    AFTER DELETE ON public.workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_totals();

-- Create triggers to automatically update exercise summaries when sets change
DROP TRIGGER IF EXISTS trigger_update_exercise_summary_insert ON public.exercise_sets;
CREATE TRIGGER trigger_update_exercise_summary_insert
    AFTER INSERT ON public.exercise_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_summary();

DROP TRIGGER IF EXISTS trigger_update_exercise_summary_update ON public.exercise_sets;
CREATE TRIGGER trigger_update_exercise_summary_update
    AFTER UPDATE ON public.exercise_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_summary();

DROP TRIGGER IF EXISTS trigger_update_exercise_summary_delete ON public.exercise_sets;
CREATE TRIGGER trigger_update_exercise_summary_delete
    AFTER DELETE ON public.exercise_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_summary();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_workouts_updated_at ON public.workouts;
CREATE TRIGGER trigger_workouts_updated_at
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_workout_exercises_updated_at ON public.workout_exercises;
CREATE TRIGGER trigger_workout_exercises_updated_at
    BEFORE UPDATE ON public.workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_exercise_sets_updated_at ON public.exercise_sets;
CREATE TRIGGER trigger_exercise_sets_updated_at
    BEFORE UPDATE ON public.exercise_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to reorder workout exercises atomically
CREATE OR REPLACE FUNCTION reorder_workout_exercises(
    exercise_ids UUID[],
    order_indices INTEGER[]
) RETURNS VOID AS $$
DECLARE
    i INTEGER;
BEGIN
    IF array_length(exercise_ids, 1) IS DISTINCT FROM array_length(order_indices, 1) THEN
        RAISE EXCEPTION 'exercise_ids and order_indices must have the same length';
    END IF;
    FOR i IN 1..array_length(exercise_ids, 1) LOOP
        UPDATE public.workout_exercises
        SET order_index = order_indices[i], updated_at = NOW()
        WHERE id = exercise_ids[i];
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_workout_exercises(UUID[], INTEGER[]) TO authenticated;

-- Allow users to view and modify only their own workouts data
-- SELECT Policy for workouts
CREATE POLICY "Allow address-based select"
ON workouts
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy for workouts
CREATE POLICY "Allow address-based insert"
ON workouts
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy for workouts
CREATE POLICY "Allow update"
ON workouts
FOR UPDATE
TO authenticated
USING ( true )
WITH CHECK ( true );

-- DELETE Policy for workouts
CREATE POLICY "Allow address-based delete"
ON workouts
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address ); 

-- SELECT Policy for workout_exercises
CREATE POLICY "Allow address-based select"
ON workout_exercises
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy for workout_exercises
CREATE POLICY "Allow address-based insert"
ON workout_exercises
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy for workout_exercises
CREATE POLICY "Allow update"
ON workout_exercises
FOR UPDATE
TO authenticated
USING ( true )
WITH CHECK ( true );

-- DELETE Policy for workout_exercises
CREATE POLICY "Allow address-based delete"
ON workout_exercises
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- SELECT Policy for exercise_sets
CREATE POLICY "Allow address-based select"
ON exercise_sets
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy for exercise_sets
CREATE POLICY "Allow address-based insert"
ON exercise_sets
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy for exercise_sets
CREATE POLICY "Allow update"
ON exercise_sets
FOR UPDATE
TO authenticated
USING ( true )
WITH CHECK ( true );

-- DELETE Policy for exercise_sets
CREATE POLICY "Allow address-based delete"
ON exercise_sets
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- Create exercise_progress table for daily tracking
CREATE TABLE IF NOT EXISTS public.exercise_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    address TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
    weight DECIMAL(8,2) NOT NULL DEFAULT 0, -- max weight for the day
    volume DECIMAL(10,2) NOT NULL DEFAULT 0, -- total volume for the day
    sets INTEGER NOT NULL DEFAULT 0, -- total sets completed
    reps INTEGER NOT NULL DEFAULT 0, -- total reps completed
    time_under_tension INTEGER NOT NULL DEFAULT 0, -- total TUT for the day (seconds)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add CHECK constraints for exercise_progress
ALTER TABLE public.exercise_progress
    ADD CONSTRAINT chk_progress_weight_nonnegative CHECK (weight >= 0),
    ADD CONSTRAINT chk_progress_volume_nonnegative CHECK (volume >= 0),
    ADD CONSTRAINT chk_progress_sets_nonnegative CHECK (sets >= 0),
    ADD CONSTRAINT chk_progress_reps_nonnegative CHECK (reps >= 0);

-- Add UNIQUE constraint to ensure one entry per exercise per day
ALTER TABLE public.exercise_progress
    ADD CONSTRAINT unique_exercise_progress_daily UNIQUE (exercise_id, address, DATE(updated_at));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_progress_exercise_id ON public.exercise_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_address ON public.exercise_progress(address);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_date ON public.exercise_progress(DATE(updated_at));

-- Enable RLS for exercise_progress
ALTER TABLE public.exercise_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_progress
CREATE POLICY "Allow address-based select"
ON exercise_progress
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

CREATE POLICY "Allow address-based insert"
ON exercise_progress
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

CREATE POLICY "Allow update"
ON exercise_progress
FOR UPDATE
TO authenticated
USING ( true )
WITH CHECK ( true );

CREATE POLICY "Allow address-based delete"
ON exercise_progress
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- Function to update updated_at timestamp for exercise_progress
DROP TRIGGER IF EXISTS trigger_exercise_progress_updated_at ON public.exercise_progress;
CREATE TRIGGER trigger_exercise_progress_updated_at
    BEFORE UPDATE ON public.exercise_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to upsert exercise progress (insert or update if exists for today)
CREATE OR REPLACE FUNCTION upsert_exercise_progress(
    p_exercise_id UUID,
    p_address TEXT,
    p_weight DECIMAL(8,2),
    p_volume DECIMAL(10,2),
    p_sets INTEGER,
    p_reps INTEGER,
    p_time_under_tension INTEGER
) RETURNS UUID AS $$
DECLARE
    existing_id UUID;
    result_id UUID;
BEGIN
    -- Check if there's already an entry for today
    SELECT id INTO existing_id
    FROM public.exercise_progress
    WHERE exercise_id = p_exercise_id 
      AND address = p_address 
      AND DATE(updated_at) = CURRENT_DATE;
    
    IF existing_id IS NOT NULL THEN
        -- Update existing entry
        UPDATE public.exercise_progress
        SET 
            weight = p_weight,
            volume = p_volume,
            sets = p_sets,
            reps = p_reps,
            time_under_tension = p_time_under_tension,
            updated_at = NOW()
        WHERE id = existing_id;
        
        result_id := existing_id;
    ELSE
        -- Insert new entry
        INSERT INTO public.exercise_progress (exercise_id, address, weight, volume, sets, reps, time_under_tension)
        VALUES (p_exercise_id, p_address, p_weight, p_volume, p_sets, p_reps, p_time_under_tension)
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_exercise_progress(UUID, TEXT, DECIMAL, DECIMAL, INTEGER, INTEGER, INTEGER) TO authenticated; 
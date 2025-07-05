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
    exercise_sets JSONB DEFAULT '[]',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_sets INTEGER DEFAULT 0
);

-- Add CHECK constraints for data integrity
ALTER TABLE public.workout_exercises
    ADD CONSTRAINT chk_sets_positive CHECK (sets > 0),
    ADD CONSTRAINT chk_reps_positive CHECK (reps > 0),
    ADD CONSTRAINT chk_weight_nonnegative CHECK (weight >= 0),
    ADD CONSTRAINT chk_completed_sets_nonnegative CHECK (completed_sets >= 0);

-- Add UNIQUE constraint to prevent duplicate exercises in the same workout
ALTER TABLE public.workout_exercises
    ADD CONSTRAINT unique_workout_exercise_name UNIQUE (workout_id, exercise_name);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workouts_address ON public.workouts(address);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(workout_id, order_index);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Function to automatically update total_volume and total_duration when exercises change
CREATE OR REPLACE FUNCTION update_workout_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.workouts 
    SET 
        total_volume = (
            SELECT COALESCE(SUM(sets * reps * weight), 0)
            FROM public.workout_exercises 
            WHERE workout_id = COALESCE(NEW.workout_id, OLD.workout_id)
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
-- SELECT Policy
CREATE POLICY "Allow address-based select"
ON workouts
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy
CREATE POLICY "Allow address-based insert"
ON workouts
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
CREATE POLICY "Allow update"
ON workouts
FOR UPDATE
TO authenticated
USING ( true )
WITH CHECK ( true );

-- DELETE Policy
CREATE POLICY "Allow address-based delete"
ON workouts
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address ); 

-- SELECT Policy
CREATE POLICY "Allow address-based select"
ON workout_exercises
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy
CREATE POLICY "Allow address-based insert"
ON workout_exercises
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
CREATE POLICY "Allow update"
ON workout_exercises
FOR UPDATE
TO authenticated
USING ( true )
WITH CHECK ( true );

-- DELETE Policy
CREATE POLICY "Allow address-based delete"
ON workout_exercises
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address ); 
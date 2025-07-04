-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_address TEXT NOT NULL,
    name TEXT NOT NULL,
    total_volume DECIMAL(10,2) DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_address ON public.workouts(user_address);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(workout_id, order_index);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Policy for workouts: users can only access their own workouts
CREATE POLICY "Users can view their own workouts" ON public.workouts
    FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'user_address');

CREATE POLICY "Users can insert their own workouts" ON public.workouts
    FOR INSERT WITH CHECK (user_address = current_setting('request.jwt.claims', true)::json->>'user_address');

CREATE POLICY "Users can update their own workouts" ON public.workouts
    FOR UPDATE USING (user_address = current_setting('request.jwt.claims', true)::json->>'user_address');

CREATE POLICY "Users can delete their own workouts" ON public.workouts
    FOR DELETE USING (user_address = current_setting('request.jwt.claims', true)::json->>'user_address');

-- Policy for workout_exercises: users can only access exercises for their own workouts
CREATE POLICY "Users can view exercises for their own workouts" ON public.workout_exercises
    FOR SELECT USING (
        workout_id IN (
            SELECT id FROM public.workouts 
            WHERE user_address = current_setting('request.jwt.claims', true)::json->>'user_address'
        )
    );

CREATE POLICY "Users can insert exercises for their own workouts" ON public.workout_exercises
    FOR INSERT WITH CHECK (
        workout_id IN (
            SELECT id FROM public.workouts 
            WHERE user_address = current_setting('request.jwt.claims', true)::json->>'user_address'
        )
    );

CREATE POLICY "Users can update exercises for their own workouts" ON public.workout_exercises
    FOR UPDATE USING (
        workout_id IN (
            SELECT id FROM public.workouts 
            WHERE user_address = current_setting('request.jwt.claims', true)::json->>'user_address'
        )
    );

CREATE POLICY "Users can delete exercises for their own workouts" ON public.workout_exercises
    FOR DELETE USING (
        workout_id IN (
            SELECT id FROM public.workouts 
            WHERE user_address = current_setting('request.jwt.claims', true)::json->>'user_address'
        )
    );

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
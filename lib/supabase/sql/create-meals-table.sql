-- Create meals table to store frequently used meals for quick access
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  calories DECIMAL NOT NULL DEFAULT 0,
  protein DECIMAL NOT NULL DEFAULT 0,
  carbohydrates DECIMAL NOT NULL DEFAULT 0,
  fats DECIMAL NOT NULL DEFAULT 0,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key to profiles table
  CONSTRAINT fk_meals_profile
    FOREIGN KEY (address)
    REFERENCES profiles(address)
    ON DELETE CASCADE
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_meals_address ON meals(address);

-- Create composite index on address and created_at for recent meals
CREATE INDEX IF NOT EXISTS idx_meals_address_created_at_desc ON meals(address, created_at DESC);

-- Create index on meal_name for searching
CREATE INDEX IF NOT EXISTS idx_meals_name ON meals(meal_name);

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER set_timestamp_meals
BEFORE UPDATE ON meals
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create RLS policy to restrict access to meals data
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own meals data
-- SELECT Policy
CREATE POLICY "Allow address-based select"
ON meals
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy
CREATE POLICY "Allow address-based insert"
ON meals
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
CREATE POLICY "Allow address-based update"
ON meals
FOR UPDATE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address )
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
CREATE POLICY "Allow address-based delete"
ON meals
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address ); 
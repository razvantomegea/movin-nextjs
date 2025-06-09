-- Create energy table to track user daily nutrition intake
CREATE TABLE IF NOT EXISTS energy (
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
  CONSTRAINT fk_energy_profile
    FOREIGN KEY (address)
    REFERENCES profiles(address)
    ON DELETE CASCADE
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_energy_address ON energy(address);

-- Create composite index on address and log_date for optimized sorting and filtering
CREATE INDEX IF NOT EXISTS idx_energy_address_log_date_desc ON energy(address, log_date DESC);

-- Create index on log_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_energy_log_date ON energy(log_date);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_energy
BEFORE UPDATE ON energy
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create RLS policy to restrict access to energy data
ALTER TABLE energy ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own energy data
-- SELECT Policy
CREATE POLICY "Allow address-based select"
ON energy
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy
CREATE POLICY "Allow address-based insert"
ON energy
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
CREATE POLICY "Allow address-based update"
ON energy
FOR UPDATE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address )
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
CREATE POLICY "Allow address-based delete"
ON energy
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address ); 
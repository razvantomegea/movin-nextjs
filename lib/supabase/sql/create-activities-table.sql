-- Create activities table to track user workout activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  name TEXT NOT NULL,
  source TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  total_energy_burned DECIMAL NOT NULL,
  total_distance DECIMAL,
  total_steps INTEGER,
  maximum_heart_rate INTEGER,
  average_heart_rate INTEGER,
  minimum_heart_rate INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key to profiles table (assuming it exists)
  CONSTRAINT fk_activities_profile
    FOREIGN KEY (address)
    REFERENCES profiles(address)
    ON DELETE CASCADE
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_activities_address ON activities(address);

-- Create composite index on address and start_date for optimized sorting and filtering
CREATE INDEX IF NOT EXISTS idx_activities_address_start_date_desc ON activities(address, start_date DESC);

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER set_timestamp_activities
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create RLS policy to restrict access to activities data
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own activities data
-- SELECT Policy
create policy "Allow address-based select"
on activities
for select
to authenticated
using ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy
create policy "Allow address-based insert"
on activities
for insert
to public
with check ( true );

-- UPDATE Policy
create policy "Allow address-based update"
on activities
for update
to authenticated
using ( (auth.jwt() ->> 'sub') = address )
with check ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
create policy "Allow address-based delete"
on activities
for delete
to authenticated
using ( (auth.jwt() ->> 'sub') = address ); 
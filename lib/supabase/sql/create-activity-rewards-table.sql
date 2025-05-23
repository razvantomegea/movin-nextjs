-- Create activity rewards table to track user rewards claiming history
CREATE TABLE IF NOT EXISTS activity_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  rewards DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to profiles table
  CONSTRAINT fk_activity_rewards_profile
    FOREIGN KEY (address)
    REFERENCES profiles(address)
    ON DELETE CASCADE
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_rewards_address ON activity_rewards(address);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_activity_rewards
BEFORE UPDATE ON activity_rewards
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create RLS policy to restrict access to activity rewards data
ALTER TABLE activity_rewards ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own activity rewards data
-- SELECT Policy
create policy "Allow address-based select"
on activity_rewards
for select
to authenticated
using ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy
create policy "Allow address-based insert"
on activity_rewards
for insert
to authenticated
with check ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
create policy "Allow address-based update"
on activity_rewards
for update
to authenticated
using ( (auth.jwt() ->> 'sub') = address )
with check ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
create policy "Allow address-based delete"
on activity_rewards
for delete
to authenticated
using ( (auth.jwt() ->> 'sub') = address ); 
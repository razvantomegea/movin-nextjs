-- Create staking table to track user staking activities
CREATE TABLE IF NOT EXISTS staking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  rewards DECIMAL NOT NULL DEFAULT 0,
  stake_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unstake_time TIMESTAMPTZ, -- NULL means still staked
  lock_period_months INTEGER NOT NULL,
  apr DECIMAL NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to profiles table (assuming it exists)
  CONSTRAINT fk_staking_profile
    FOREIGN KEY (address)
    REFERENCES profiles(address)
    ON DELETE CASCADE
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_staking_address ON staking(address);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON staking
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create RLS policy to restrict access to staking data
ALTER TABLE staking ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own staking data
-- SELECT Policy
create policy "Allow address-based select"
on staking
for select
to authenticated
using ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy (critical fix)
create policy "Allow address-based insert"
on staking
for insert
to authenticated
with check ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
create policy "Allow address-based update"
on staking
for update
to authenticated
using ( (auth.jwt() ->> 'sub') = address )
with check ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
create policy "Allow address-based delete"
on staking
for delete
to authenticated
using ( (auth.jwt() ->> 'sub') = address );

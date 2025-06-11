-- Create push_subscriptions table to track user push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key to profiles table
  CONSTRAINT fk_push_subscriptions_profile
    FOREIGN KEY (address)
    REFERENCES profiles(address)
    ON DELETE CASCADE,
    
  -- Unique constraint to prevent duplicate subscriptions for same endpoint and user
  UNIQUE(address, endpoint)
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_address ON push_subscriptions(address);

-- Create index on endpoint for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Create composite index on address and is_active for active subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_address_active ON push_subscriptions(address, is_active);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_push_subscriptions
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create RLS policy to restrict access to push subscriptions data
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own push subscriptions data
-- SELECT Policy
CREATE POLICY "Allow address-based select"
ON push_subscriptions
FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy
CREATE POLICY "Allow address-based insert"
ON push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
CREATE POLICY "Allow address-based update"
ON push_subscriptions
FOR UPDATE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address )
WITH CHECK ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
CREATE POLICY "Allow address-based delete"
ON push_subscriptions
FOR DELETE
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address );

-- UPSERT Policy (ALL operations for upsert to work)
CREATE POLICY "Allow address-based upsert"
ON push_subscriptions
FOR ALL
TO authenticated
USING ( (auth.jwt() ->> 'sub') = address )
WITH CHECK ( (auth.jwt() ->> 'sub') = address ); 
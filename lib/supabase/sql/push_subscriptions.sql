-- Create a table for storing push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    -- Foreign key to profiles table
    CONSTRAINT fk_push_subscriptions_profile
      FOREIGN KEY (address)
      REFERENCES profiles(address)
      ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS push_subscriptions_address_idx ON push_subscriptions(address);
CREATE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions(endpoint);

-- Trigger to update updated_at on change
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add RLS policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own push subscriptions
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
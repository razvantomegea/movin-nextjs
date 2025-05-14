-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public reads of profiles
CREATE POLICY "Anyone can read profiles"
ON profiles
FOR SELECT
USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING ((auth.jwt() ->> 'sub')::text = address);

-- For service role access (handled by the API)
-- Note: This is handled by using the admin client in the API

-- Delete existing policy if it's causing issues
DROP POLICY IF EXISTS "Authenticated users can insert profiles with matching address" ON profiles;

-- Create a policy that correctly verifies the JWT sub claim
CREATE POLICY "Authenticated users can insert profiles with matching address"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub')::text = address);

-- Additional policy for deleting profiles (optional)
CREATE POLICY "Users can delete own profile"
ON profiles
FOR DELETE
USING ((auth.jwt() ->> 'sub')::text = address); 
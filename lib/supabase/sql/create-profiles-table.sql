ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "weight" NUMERIC,
ADD COLUMN IF NOT EXISTS "weight_unit" VARCHAR DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS "weight_updated_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "weight" NUMERIC(6,2) CHECK ("weight" > 0),
ADD COLUMN IF NOT EXISTS "weight_unit" VARCHAR
  DEFAULT 'kg'
  CHECK (lower("weight_unit") IN ('kg','lb')),
ADD COLUMN IF NOT EXISTS "biological_sex" VARCHAR
  CHECK (lower("biological_sex") IN ('male','female')),
ADD COLUMN IF NOT EXISTS "total_earned" NUMERIC(10,2) DEFAULT 0.00 CHECK ("total_earned" >= 0),
ADD COLUMN IF NOT EXISTS "privacy_setting" VARCHAR DEFAULT 'public'
  CHECK (lower("privacy_setting") IN ('public','partially_public','private')),
ADD COLUMN IF NOT EXISTS "allow_connection_requests" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "profile_description" TEXT,
ADD COLUMN IF NOT EXISTS "location" VARCHAR,
ADD COLUMN IF NOT EXISTS "website" VARCHAR;

-- INSERT Policy
create policy "Allow address-based insert"
on profiles
for insert
to authenticated
with check ( (auth.jwt() ->> 'sub') = address );

-- UPDATE Policy
create policy "Allow address-based update"
on profiles
for update
to authenticated
using ( (auth.jwt() ->> 'sub') = address )
with check ( (auth.jwt() ->> 'sub') = address );

-- DELETE Policy
create policy "Allow address-based delete"
on profiles
for delete
to authenticated
using ( (auth.jwt() ->> 'sub') = address );

-- SELECT Policy for public access to profiles
create policy "Allow public access to public profiles"
on profiles
for select
to authenticated
using (
  privacy_setting = 'public' OR
  (auth.jwt() ->> 'sub') = address OR
  (privacy_setting = 'partially_public' AND 
   EXISTS(SELECT 1 FROM connections 
          WHERE (requester_address = (auth.jwt() ->> 'sub') AND addressee_address = address AND status = 'accepted') OR
                (addressee_address = (auth.jwt() ->> 'sub') AND requester_address = address AND status = 'accepted')
         )
  )
);

-- Allow anonymous users to view public profiles for profile discovery
create policy "Allow anonymous access to public profiles"
on profiles
for select
to anon
using (privacy_setting = 'public');

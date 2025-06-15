ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "weight" NUMERIC,
ADD COLUMN IF NOT EXISTS "weight_unit" VARCHAR DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS "weight_updated_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "height" NUMERIC,
ADD COLUMN IF NOT EXISTS "date_of_birth" DATE,
ADD COLUMN IF NOT EXISTS "biological_sex" VARCHAR CHECK ("biological_sex" IN ('male', 'female'));

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

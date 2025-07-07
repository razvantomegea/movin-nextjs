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
ADD COLUMN IF NOT EXISTS "total_earned" NUMERIC(10,2) DEFAULT 0.00 CHECK ("total_earned" >= 0);

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

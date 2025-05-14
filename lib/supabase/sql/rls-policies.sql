-- SELECT Policy
create policy "Allow address-based select"
on profiles
for select
to authenticated
using ( (auth.jwt() ->> 'sub') = address );

-- INSERT Policy (critical fix)
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

# JWT Authentication with Wallet and Supabase

This document explains the JWT authentication flow implemented in the Movin app.

## Overview

The application uses a wallet-based authentication system with JWT tokens:

1. User connects their wallet using `@reown/appkit`
2. The wallet address is sent to a server endpoint that:
   - Generates a JWT token with the wallet address as the subject
   - Uses the admin client to check if a profile exists for the user
   - Creates a profile if one doesn't exist, using the admin client (bypasses RLS)
   - Returns the JWT token
3. The client stores the token and sets up the Supabase client with the token in the Authorization header
4. The user is redirected to the dashboard

## Required Environment Variables

Add these to your `.env.local` file:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret_key_replace_this_with_a_secure_random_string
```

## Security Considerations

- The JWT secret is stored server-side (but exposed to the client for Next.js API routes)
- JWTs expire after 7 days
- The wallet address is used as the subject of the JWT
- Profile creation is handled server-side using the admin client
- After login, all client operations use the JWT for RLS policy enforcement

## Supabase Database Structure

The system uses two main tables:

### Users Table

- `id` (auto-generated)
- `address` (string) - the wallet address

### Profiles Table

- `id` (auto-generated)
- `address` (string) - the wallet address (matches users table)
- `username` (string) - defaults to the address on first login
- `email` (string)
- `avatar_url` (string)
- `level` (number) - defaults to 1
- `streak_days` (number) - defaults to 0
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Row Level Security (RLS) Policies

The system uses the following RLS policies:

```sql
-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
CREATE POLICY "Anyone can read profiles"
ON profiles
FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING ((auth.jwt() ->> 'sub')::text = address);

-- Authenticated users can insert profiles with matching address
CREATE POLICY "Authenticated users can insert profiles with matching address"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub')::text = address);
```

## Client Usage

When making authenticated requests from the client:

```typescript
// Create client with JWT token
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
```

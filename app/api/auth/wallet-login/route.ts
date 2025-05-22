import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { createSupabaseClientBrowser } from '@/lib/supabase/createClient';

export async function POST(request: Request) {
  try {
    // Get address from request
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Create JWT with claims needed for Supabase
    const token = jwt.sign(
      {
        sub: address,
        role: 'authenticated',
        address,
        aud: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
      },
      process.env.NEXT_PUBLIC_JWT_SECRET || '',
    );

    // Create Supabase admin client to check/create user
    const supabase = createSupabaseClientBrowser();

    // Check if user exists in Supabase
    const { data: existingUser, error: getUserError } = await supabase
      .from('profiles')
      .select('*')
      .eq('address', address)
      .single();

    if (getUserError && getUserError.code !== 'PGRST116') {
      console.error('Error checking user:', getUserError);
    }

    // If user doesn't exist, create one
    if (!existingUser) {
      const { error: createUserError } = await supabase
        .from('profiles')
        .insert([{ address, username: address }]);

      if (createUserError) {
        console.error('Error creating user:', createUserError);
      }
    }

    // Create the response with authentication data
    const response = NextResponse.json({
      token,
      user: existingUser || { address },
      message: 'Authentication successful',
    });

    // Set token in cookies for Supabase client to use
    // Make the cookie accessible to client-side JavaScript for storage operations
    response.cookies.set({
      name: 'supabase-auth-token',
      value: token,
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      httpOnly: false, // Allow JavaScript access for Supabase client
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Allow cross-site requests in a relaxed way
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

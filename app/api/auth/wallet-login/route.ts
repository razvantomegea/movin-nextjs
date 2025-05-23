import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get address from request
    const { address } = await request.json();
    const addressLower = address?.toLowerCase();

    if (!addressLower) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Create JWT with claims needed for Supabase
    const token = jwt.sign(
      {
        sub: addressLower,
        role: 'authenticated',
        address: addressLower,
        aud: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
      },
      process.env.NEXT_PUBLIC_JWT_SECRET || '',
    );

    // Create the response with authentication data
    const response = NextResponse.json({
      token,
      user: { address: addressLower },
      message: 'Authentication successful',
    });

    // Set token in cookies for Supabase client to use
    // Make the cookie accessible to client-side JavaScript for storage operations
    response.cookies.set({
      name: 'supabase-auth-token',
      value: token,
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: false, // restrict JS access; proxy requests via server
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

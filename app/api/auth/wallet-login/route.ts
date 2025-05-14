import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get address from request
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Create JWT
    const token = jwt.sign(
      { sub: address, role: 'authenticated', address },
      process.env.NEXT_PUBLIC_JWT_SECRET || '',
      { expiresIn: '7d' },
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

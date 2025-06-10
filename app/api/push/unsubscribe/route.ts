import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
      return NextResponse.json(
        { error: 'Valid subscription endpoint is required' },
        { status: 400 },
      );
    }

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || supabaseUrl.trim() === '') {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not defined or empty');
      return NextResponse.json(
        {
          error: 'Server configuration error: Supabase URL not configured',
        },
        { status: 500 },
      );
    }

    if (!supabaseKey || supabaseKey.trim() === '') {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not defined or empty');
      return NextResponse.json(
        {
          error: 'Server configuration error: Supabase service key not configured',
        },
        { status: 500 },
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Remove the subscription from the database
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);

    if (error) {
      console.error('Error removing push subscription:', error);
      return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscription removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Push unsubscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

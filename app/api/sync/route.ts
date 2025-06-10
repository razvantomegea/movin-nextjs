import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Data array is required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process each data item
    const results = await Promise.allSettled(
      data.map(async (item) => {
        // Determine what type of data it is and process accordingly
        // This is just an example - adapt to your specific data structure
        if (item.type === 'activity') {
          // Handle activity data
          const { error } = await supabase.from('activities').insert(item.data);

          return {
            success: !error,
            id: item.id,
            type: item.type,
            error: error ? error.message : null,
          };
        } else if (item.type === 'goal') {
          // Handle goal data
          const { error } = await supabase.from('goals').insert(item.data);

          return {
            success: !error,
            id: item.id,
            type: item.type,
            error: error ? error.message : null,
          };
        } else {
          // Unknown data type
          return {
            success: false,
            id: item.id,
            type: item.type,
            error: 'Unknown data type',
          };
        }
      }),
    );

    const successful = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success,
    ).length;

    return NextResponse.json(
      {
        message: `Synchronized ${successful} out of ${data.length} items`,
        results,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

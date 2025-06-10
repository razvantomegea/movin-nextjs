import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Here you would typically:
    // 1. Remove the subscription from your database
    // 2. Clean up any associated data

    console.log('Push unsubscription received for endpoint:', endpoint);

    // For now, we'll just acknowledge the unsubscription
    // In production, you'd remove this from your database
    // Example:
    // await removeSubscriptionFromDatabase(endpoint);

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Error handling push unsubscription:', error);

    return NextResponse.json({ error: 'Failed to process unsubscription' }, { status: 500 });
  }
}

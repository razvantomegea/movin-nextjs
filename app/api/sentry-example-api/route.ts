import { NextResponse } from 'next/server';
import { APIError, captureAPIError } from '@/lib/sentry';

export const dynamic = 'force-dynamic';

// A faulty API route to test Sentry's error monitoring
export function GET() {
  try {
    // Simulate some processing
    const shouldThrowError = Math.random() > 0.5; // 50% chance of error

    if (shouldThrowError) {
      throw new APIError('This error is raised on the backend called by the example page.', 500);
    }

    return NextResponse.json({
      data: 'Testing Sentry - Request successful!',
      timestamp: Date.now(),
    });
  } catch (error) {
    // Capture the error with API context
    if (error instanceof Error) {
      captureAPIError(error, '/api/sentry-example-api', 'GET', 500);
    }

    // Re-throw to trigger Sentry's automatic error capture
    throw error;
  }
}

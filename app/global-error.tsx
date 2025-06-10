'use client';

import { useEffect, useState } from 'react';
import NextError from 'next/error';
import { BugReportButton } from '@/components/feedback/BugReportButton';
import { captureErrorWithContext } from '@/lib/sentry';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const [eventId, setEventId] = useState<string>();

  useEffect(() => {
    const id = captureErrorWithContext(error, {
      tags: {
        component: 'GlobalError',
        category: 'global',
      },
      extra: {
        digest: error.digest,
        timestamp: Date.now(),
      },
      level: 'fatal',
    });

    if (typeof id === 'string') {
      setEventId(id);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {/* `NextError` is the default Next.js error page component. Its type
          definition requires a `statusCode` prop. However, since the App Router
          does not expose status codes for errors, we simply pass 0 to render a
          generic error message. */}
          <NextError statusCode={0} />

          <div style={{ marginTop: '20px' }}>
            <p style={{ marginBottom: '10px', color: '#666' }}>
              Something went wrong. Help us improve by reporting this issue.
            </p>
            <BugReportButton
              eventId={eventId}
              prefilledData={{
                title: 'Global Application Error',
                description: `An unexpected error occurred: ${error.message}`,
                severity: 'high',
              }}
              variant="default"
              size="default"
            >
              Report This Error
            </BugReportButton>
          </div>
        </div>
      </body>
    </html>
  );
}

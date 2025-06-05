'use client';

import { useEffect } from 'react';
import NextError from 'next/error';
import { captureErrorWithContext } from '@/lib/sentry';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureErrorWithContext(error, {
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
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

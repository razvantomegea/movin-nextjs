import * as Sentry from '@sentry/nextjs';

// Add this utility at the top of lib/sentry/config.ts
function isLocalhost() {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
  // Server-side
  return (
    process.env.HOST?.includes('localhost') ||
    process.env.HOST?.includes('127.0.0.1') ||
    process.env.VERCEL_URL?.includes('localhost') ||
    process.env.NODE_ENV === 'development'
  );
}

// Centralized Sentry configuration
export const SENTRY_CONFIG = {
  dsn:
    process.env.SENTRY_DSN ||
    'https://3dc4ead837625587a327933545810a18@o4509446531842048.ingest.de.sentry.io/4509446532890704',

  // Common configuration
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'true',

  // Environment detection
  environment: process.env.NODE_ENV || 'development',

  // Release information
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

  // Client-specific configuration
  client: {
    // Session replay configuration
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Browser-specific integrations
    beforeSend: (event: Sentry.Event) => {
      if (isLocalhost()) {
        return null;
      }

      // Filter out non-error events in production
      if (process.env.NODE_ENV === 'production' && event.level !== 'error') {
        return null;
      }

      return event;
    },
  },

  // Server-specific configuration
  server: {
    // Server-specific settings
    beforeSend: (event: Sentry.Event) => {
      // Log server errors for debugging
      if (process.env.NODE_ENV === 'development' || isLocalhost()) {
        console.error('Sentry Server Error:', event);
        return null;
      }

      return event;
    },
  },

  // Edge-specific configuration
  edge: {
    // Edge runtime specific settings
    beforeSend: (event: Sentry.Event) => {
      if (isLocalhost()) {
        return null;
      }

      // Edge runtime error handling
      return event;
    },
  },
} as const;

// Helper function to get configuration for specific runtime
export function getSentryConfig(runtime: 'client' | 'server' | 'edge') {
  const baseConfig = {
    dsn: SENTRY_CONFIG.dsn,
    tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
    debug: SENTRY_CONFIG.debug,
    environment: SENTRY_CONFIG.environment,
    release: SENTRY_CONFIG.release,
  };

  switch (runtime) {
    case 'client':
      return {
        ...baseConfig,
        ...SENTRY_CONFIG.client,
      };
    case 'server':
      return {
        ...baseConfig,
        ...SENTRY_CONFIG.server,
      };
    case 'edge':
      return {
        ...baseConfig,
        ...SENTRY_CONFIG.edge,
      };
    default:
      return baseConfig;
  }
}

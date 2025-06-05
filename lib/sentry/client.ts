// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { getSentryConfig } from './config';

const config = getSentryConfig('client');

Sentry.init({
  ...config,

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Capture only on errors in production
      maskAllText: process.env.NODE_ENV === 'production',
      blockAllMedia: process.env.NODE_ENV === 'production',
    }),
  ],
});

// Export useful functions for client-side error handling
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const addBreadcrumb = Sentry.addBreadcrumb;
export const setUser = Sentry.setUser;
export const setTag = Sentry.setTag;
export const setContext = Sentry.setContext;
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

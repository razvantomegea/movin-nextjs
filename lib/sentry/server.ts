// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { getSentryConfig } from './config';

const config = getSentryConfig('server');

Sentry.init({
  ...config,

  // Server-specific integrations
  integrations: [
    // Add server-specific integrations here
    // Sentry.prismaIntegration(), // Uncomment if using Prisma
    // Add other integrations as needed
  ].filter(Boolean),
});

// Export useful functions for server-side error handling
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const addBreadcrumb = Sentry.addBreadcrumb;
export const setUser = Sentry.setUser;
export const setTag = Sentry.setTag;
export const setContext = Sentry.setContext;
export const captureRequestError = Sentry.captureRequestError;

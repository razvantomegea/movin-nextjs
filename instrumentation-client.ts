// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Import from the centralized configuration
import { onRouterTransitionStart } from '@/lib/sentry/client';

export { onRouterTransitionStart };

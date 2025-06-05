// Main Sentry module exports
// This file provides a clean interface for importing Sentry functionality throughout the app

// Configuration
export { SENTRY_CONFIG, getSentryConfig } from './config';

// Utility functions and custom error classes
export {
  APIError,
  ValidationError,
  BlockchainError,
  captureErrorWithContext,
  captureBlockchainError,
  captureAPIError,
  measurePerformance,
  setSentryUser,
  clearSentryUser,
  addUserActionBreadcrumb,
} from './utils';

// Re-export commonly used Sentry functions
export {
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setContext,
} from '@sentry/nextjs';

/**
 * Authentication utilities for handling wallet disconnection and logout
 */
import * as Sentry from '@sentry/nextjs';

/**
 * Forces a logout by clearing all authentication data and redirecting to home
 */
export function forceLogout(): void {
  try {
    // Clear localStorage data
    localStorage.clear();

    // Clear sessionStorage data (if any)
    sessionStorage.clear();

    // Redirect to home page
    window.location.href = '/';
  } catch (error) {
    console.error('Error during logout:', error);
    Sentry.captureException(error);
    // Force redirect even if cleanup fails
    window.location.href = '/';
  }
}

/**
 * Handles authentication errors and redirects to connect page
 * @param error - The error that occurred
 * @param context - Optional context about where the error occurred
 */
export function handleAuthError(error: Error | string, context?: string): void {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Check if error is auth-related
  const isAuthError =
    errorMessage.includes('No auth token') ||
    errorMessage.includes('Invalid auth token') ||
    errorMessage.includes('Auth token expired') ||
    errorMessage.includes('not logged in') ||
    errorMessage.includes('no account') ||
    errorMessage.includes('no address') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Authentication') ||
    errorMessage.includes('not authenticated');

  if (isAuthError) {
    console.warn(`Auth error detected${context ? ` in ${context}` : ''}: ${errorMessage}`);

    // Capture the error for monitoring
    Sentry.captureException(typeof error === 'string' ? new Error(error) : error, {
      tags: {
        errorType: 'auth_error',
        context: context || 'unknown',
      },
    });

    // Store the current path so user can be redirected back after connecting
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      try {
        sessionStorage.setItem('intendedPath', window.location.pathname + window.location.search);
      } catch (storageError) {
        console.error('Failed to store intended path:', storageError);
      }
    }

    // Clear auth data and redirect to connect page
    forceLogout();
  }
}

/**
 * Checks if the wallet is connected by verifying both the address and connection status
 * @param address - The wallet address
 * @param isConnected - The connection status from useAppKitAccount
 * @returns boolean indicating if wallet is properly connected
 */
export function isWalletConnected(address: string | undefined, isConnected: boolean): boolean {
  return !!(address && isConnected);
}

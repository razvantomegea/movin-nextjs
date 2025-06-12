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
 * Checks if the wallet is connected by verifying both the address and connection status
 * @param address - The wallet address
 * @param isConnected - The connection status from useAppKitAccount
 * @returns boolean indicating if wallet is properly connected
 */
export function isWalletConnected(address: string | undefined, isConnected: boolean): boolean {
  return !!(address && isConnected);
}

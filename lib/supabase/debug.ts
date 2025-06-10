/**
 * Debug utilities for Supabase client management
 * Use these functions to troubleshoot multiple client instance issues
 */

import { isClientInitialized, resetClient } from './createClient';

// Track client creation calls for debugging
let clientCreationCount = 0;
let creationTimestamps: number[] = [];

export function trackClientCreation() {
  clientCreationCount++;
  creationTimestamps.push(Date.now());

  if (process.env.NODE_ENV === 'development') {
    console.log(`Supabase client creation #${clientCreationCount} at ${new Date().toISOString()}`);

    if (clientCreationCount > 1) {
      console.warn('⚠️ Multiple Supabase client creations detected!');
      console.log(
        'Creation timestamps:',
        creationTimestamps.map((ts) => new Date(ts).toISOString()),
      );
    }
  }
}

export function getClientStats() {
  return {
    creationCount: clientCreationCount,
    isInitialized: isClientInitialized(),
    creationTimestamps: creationTimestamps.map((ts) => new Date(ts).toISOString()),
  };
}

export function resetClientStats() {
  if (process.env.NODE_ENV === 'development') {
    clientCreationCount = 0;
    creationTimestamps = [];
    resetClient();
    console.log('🔄 Supabase client stats reset');
  }
}

// Helper to log current client status
export function logClientStatus() {
  if (process.env.NODE_ENV === 'development') {
    const stats = getClientStats();
    console.log('📊 Supabase Client Status:', stats);
  }
}

// Function to check for potential issues
export function checkForIssues(): string[] {
  const issues: string[] = [];

  if (clientCreationCount > 1) {
    issues.push(`Multiple client instances created (${clientCreationCount})`);
  }

  if (typeof window !== 'undefined' && !isClientInitialized()) {
    issues.push('Client not initialized on browser');
  }

  return issues;
}

// Sentry utility functions for error handling and logging
import * as Sentry from '@sentry/nextjs';

// Custom error classes for better error categorization
export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BlockchainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockchainError';
  }
}

// Enhanced error capture with context
export function captureErrorWithContext(
  error: unknown,
  context?: {
    user?: { id?: string; address?: string };
    extra?: Record<string, any>;
    tags?: Record<string, string>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  },
) {
  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    // Add error type as tag
    scope.setTag('errorType', (error as Error).constructor.name);

    Sentry.captureException(error);
  });
}

// Blockchain-specific error handler
export function captureBlockchainError(
  error: unknown,
  transactionHash?: string,
  contractAddress?: string,
  userAddress?: string,
) {
  captureErrorWithContext(error, {
    tags: {
      category: 'blockchain',
      ...(transactionHash && { transactionHash }),
      ...(contractAddress && { contractAddress }),
    },
    user: userAddress ? { address: userAddress } : undefined,
    extra: {
      blockchain: 'base',
      timestamp: Date.now(),
    },
  });
}

// API error handler
export function captureAPIError(
  error: unknown,
  endpoint: string,
  method: string,
  statusCode?: number,
) {
  captureErrorWithContext(error, {
    tags: {
      category: 'api',
      endpoint,
      method,
      ...(statusCode && { statusCode: statusCode.toString() }),
    },
    extra: {
      url: endpoint,
      httpMethod: method,
      timestamp: Date.now(),
    },
  });
}

// Performance monitoring helper
export function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: Record<string, string>,
): Promise<T> {
  return Sentry.startSpan(
    {
      name: operationName,
      op: 'custom.operation',
      attributes: context,
    },
    async () => {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
  );
}

// Set user context for the session
export function setSentryUser(user: {
  id?: string;
  address?: string;
  username?: string;
  email?: string;
  isPremium?: boolean;
}) {
  Sentry.setUser({
    id: user.id || user.address,
    username: user.username,
    email: user.email,
    ...(user.address && { wallet_address: user.address }),
    ...(user.isPremium !== undefined && { premium: user.isPremium }),
  });
}

// Clear user context (for logout)
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Add breadcrumb for user actions
export function addUserActionBreadcrumb(
  action: string,
  category: 'ui' | 'navigation' | 'blockchain' | 'api' = 'ui',
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({
    message: action,
    category,
    level: 'info',
    timestamp: Date.now() / 1000,
    data,
  });
}

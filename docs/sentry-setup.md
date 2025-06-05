# Sentry Integration Documentation

## Overview

This project uses Sentry for error monitoring, performance tracking, and user session replay. The Sentry configuration has been organized in the `@/lib/sentry` directory for better maintainability and reusability.

## Directory Structure

```
lib/sentry/
├── index.ts          # Main exports
├── config.ts         # Centralized configuration
├── client.ts         # Client-side initialization
├── server.ts         # Server-side initialization
├── edge.ts           # Edge runtime initialization
└── utils.ts          # Utility functions and custom error classes
```

## Configuration

### Environment Variables

Set the following environment variables:

```bash
SENTRY_DSN=your_sentry_dsn_here
NODE_ENV=development|production
SENTRY_DEBUG=true  # Optional: Enable Sentry debug logging in development
VERCEL_GIT_COMMIT_SHA=auto_set_by_vercel
```

### Features

- **Environment-based configuration**: Different settings for development and production
- **Custom error classes**: `APIError`, `ValidationError`, `BlockchainError`
- **Enhanced error capture**: Context-aware error reporting with user data, tags, and extra information
- **Performance monitoring**: Built-in performance measurement utilities
- **User tracking**: Automatic user context management with wallet connections
- **Breadcrumbs**: User action tracking for better debugging

## Usage

### Basic Error Capture

```typescript
import { captureErrorWithContext } from '@/lib/sentry';

try {
  // Your code here
} catch (error) {
  captureErrorWithContext(error, {
    tags: { component: 'MyComponent' },
    extra: { additionalData: 'value' },
    level: 'error',
  });
}
```

### Blockchain Error Handling

```typescript
import { captureBlockchainError } from '@/lib/sentry';

captureBlockchainError(error, transactionHash, contractAddress, userAddress);
```

### Performance Monitoring

```typescript
import { measurePerformance } from '@/lib/sentry';

const result = await measurePerformance(
  'Database Query',
  async () => {
    return await fetchData();
  },
  { query: 'user_data' },
);
```

### User Context Management

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

// Set user context
setSentryUser({
  id: 'user123',
  address: '0x...',
  username: 'john_doe',
  isPremium: true,
});

// Clear user context (on logout)
clearSentryUser();
```

### Adding Breadcrumbs

```typescript
import { addUserActionBreadcrumb } from '@/lib/sentry';

addUserActionBreadcrumb('Button clicked', 'ui', {
  buttonId: 'submit-form',
  formData: { field1: 'value1' },
});
```

### User Bug Reporting

#### Quick Setup with Components

```typescript
import { BugReportButton } from '@/components/feedback';

// Simple bug report button
<BugReportButton />

// With custom styling and prefilled data
<BugReportButton
  variant="default"
  size="lg"
  prefilledData={{
    title: 'Feature Request',
    severity: 'low',
  }}
>
  Report Issue
</BugReportButton>

// Use Sentry's native dialog
<BugReportButton useSentryDialog={true} />
```

#### Programmatic Usage

```typescript
import { useBugReport } from '@/lib/hooks/useBugReport';
import { showUserFeedbackDialog, showFeedbackForError } from '@/lib/sentry';

function MyComponent() {
  const { openBugReport, showSentryDialog, reportError } = useBugReport();

  const handleError = (error: Error) => {
    // Show feedback dialog for specific error
    showFeedbackForError(error, {
      component: 'MyComponent',
      action: 'button_click',
    });
  };

  const handleManualReport = () => {
    // Open custom bug report modal
    openBugReport({
      title: 'Manual bug report',
      severity: 'medium',
    });
  };

  const handleQuickReport = () => {
    // Show Sentry's native dialog
    showSentryDialog({
      title: 'Quick Bug Report',
    });
  };
}
```

#### Custom Error Classes for Bug Reporting

```typescript
import { UserReportableError } from '@/lib/sentry';

// Error that automatically shows feedback dialog
throw new UserReportableError('Something went wrong', {
  component: 'PaymentForm',
  severity: 'high',
  showFeedbackDialog: true,
});

// Error captured silently (no dialog)
const error = new UserReportableError('Background error', {
  showFeedbackDialog: false,
});
```

## Automatic Integration

### Wallet Connection Tracking

The `useSentryUser` hook automatically:

- Sets user context when wallet connects
- Clears context when wallet disconnects
- Updates user data when profile changes
- Adds breadcrumbs for connection events

```typescript
import { useSentryUser } from '@/lib/hooks/useSentryUser';

function MyComponent() {
  const sentryUser = useSentryUser();
  // User context is automatically managed
}
```

### Blockchain Operations

The `useMovinEarn` hook automatically:

- Captures blockchain errors with transaction context
- Adds breadcrumbs for user actions
- Includes contract addresses and user addresses in error reports

## Error Classes

### APIError

For API-related errors with HTTP status codes:

```typescript
throw new APIError('Invalid request', 400);
```

### ValidationError

For form validation and input errors:

```typescript
throw new ValidationError('Email is required', 'email');
```

### BlockchainError

For blockchain and smart contract errors:

```typescript
throw new BlockchainError('Transaction failed', 'INSUFFICIENT_FUNDS');
```

## Configuration Options

### Client Configuration

- Session replay with privacy controls
- Error filtering for production
- Performance monitoring

### Server Configuration

- Server-specific integrations
- Enhanced error logging in development
- Request error capture

### Edge Configuration

- Lightweight configuration for edge runtime
- Limited integrations due to runtime constraints

## Best Practices

1. **Use specific error classes** for better categorization
2. **Add context** to error captures with relevant data
3. **Set user context** early in the application lifecycle
4. **Use breadcrumbs** to track user journey
5. **Monitor performance** for critical operations
6. **Filter sensitive data** in production environments

## Troubleshooting

### Common Issues

1. **Sentry not capturing errors**: Check DSN configuration and network connectivity
2. **Too many events**: Adjust sample rates in production
3. **Missing user context**: Ensure `useSentryUser` hook is used in root components
4. **Performance overhead**: Reduce trace sample rate in high-traffic environments

### Debug Mode

Enable debug mode in development:

```bash
# Set environment variable
SENTRY_DEBUG=true
```

Or in config.ts:

```typescript
debug: process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'true';
```

This will log Sentry operations to the console for debugging. Note: Debug mode requires a debug-enabled Sentry bundle, so it's only enabled when explicitly requested via environment variable.

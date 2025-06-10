// Sentry User Feedback utilities
import * as Sentry from '@sentry/nextjs';

/**
 * Shows the Sentry user feedback dialog
 * This opens a modal where users can submit feedback directly to Sentry
 */
export function showUserFeedbackDialog(options?: {
  title?: string;
  subtitle?: string;
  labelName?: string;
  labelEmail?: string;
  labelComments?: string;
  labelClose?: string;
  labelSubmit?: string;
  successMessage?: string;
  eventId?: string;
}) {
  const feedbackOptions = {
    // Default text options
    title: options?.title || 'Report a Bug',
    subtitle: options?.subtitle || 'Help us improve by reporting what went wrong',
    labelName: options?.labelName || 'Your Name',
    labelEmail: options?.labelEmail || 'Your Email',
    labelComments: options?.labelComments || 'What happened?',
    labelClose: options?.labelClose || 'Close',
    labelSubmit: options?.labelSubmit || 'Submit Bug Report',
    successMessage: options?.successMessage || 'Thank you for your feedback!',

    // Use provided event ID or capture a new one
    eventId: options?.eventId || Sentry.captureMessage('User feedback requested', 'info'),
  };

  // Check if showReportDialog is available (older API)
  if (typeof Sentry.showReportDialog === 'function') {
    Sentry.showReportDialog(feedbackOptions);
  } else {
    // Fallback to newer feedback API
    console.warn('showReportDialog is not available. Using captureFeedback as fallback.');
    if (typeof Sentry.captureFeedback === 'function') {
      Sentry.captureFeedback({
        message: 'User requested feedback dialog',
        associatedEventId: feedbackOptions.eventId,
      });
    } else {
      // Ultimate fallback - just capture a message
      console.warn('Neither showReportDialog nor captureFeedback are available.');
      Sentry.captureMessage('User requested feedback dialog', 'info');
    }
  }
}

/**
 * Captures user feedback programmatically without showing a dialog
 */
export function captureUserFeedback(feedback: {
  name: string;
  email: string;
  comments: string;
  eventId?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
  };
}) {
  // Set user context if provided
  if (feedback.user) {
    Sentry.setUser(feedback.user);
  }

  // Use the new captureFeedback API if available
  if (typeof Sentry.captureFeedback === 'function') {
    const feedbackId = Sentry.captureFeedback({
      message: feedback.comments,
      name: feedback.name,
      email: feedback.email,
      ...(feedback.eventId && { associatedEventId: feedback.eventId }),
    });
    return feedbackId;
  } else {
    // Fallback to capturing as a regular event with feedback context
    console.warn('captureFeedback is not available. Using captureMessage as fallback.');
    const eventId = Sentry.withScope((scope) => {
      scope.setTag('feedback', true);
      scope.setTag('feedback_type', 'user_report');
      scope.setUser({
        id: feedback.user?.id,
        username: feedback.user?.username,
        email: feedback.email,
      });
      scope.setContext('feedback', {
        name: feedback.name,
        email: feedback.email,
        comments: feedback.comments,
        event_id: feedback.eventId,
        timestamp: new Date().toISOString(),
      });

      return Sentry.captureMessage(`User Feedback: ${feedback.comments}`, 'info');
    });

    return eventId;
  }
}

/**
 * Shows feedback dialog after an error occurs
 */
export function showFeedbackForError(
  error: Error,
  context?: {
    component?: string;
    action?: string;
    additionalData?: Record<string, unknown>;
  },
) {
  // Capture the error first and get the event ID
  const eventId = Sentry.captureException(error, {
    tags: {
      feedback_trigger: true,
      ...(context?.component && { component: context.component }),
      ...(context?.action && { action: context.action }),
    },
    extra: context?.additionalData,
  });

  // Show feedback dialog with the error event ID
  showUserFeedbackDialog({
    title: 'Something went wrong',
    subtitle: 'We encountered an error. Please help us fix it by providing more details.',
    eventId,
  });

  return eventId;
}

/**
 * Creates a custom error that triggers feedback collection
 */
export class UserReportableError extends Error {
  public eventId?: string;

  constructor(
    message: string,
    public context?: {
      component?: string;
      action?: string;
      severity?: 'low' | 'medium' | 'high';
      showFeedbackDialog?: boolean;
    },
  ) {
    super(message);
    this.name = 'UserReportableError';

    // Automatically capture the error
    this.eventId = Sentry.captureException(this, {
      tags: {
        user_reportable: true,
        severity: context?.severity || 'medium',
        ...(context?.component && { component: context.component }),
        ...(context?.action && { action: context.action }),
      },
      level: context?.severity === 'high' ? 'error' : 'warning',
    });

    // Optionally show feedback dialog immediately
    if (context?.showFeedbackDialog !== false) {
      setTimeout(() => {
        showUserFeedbackDialog({
          eventId: this.eventId,
          title: 'Help us fix this issue',
          subtitle: message,
        });
      }, 100); // Small delay to ensure error is captured
    }
  }
}

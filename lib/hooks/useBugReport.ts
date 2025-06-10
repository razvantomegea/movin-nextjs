'use client';

import { useState, useCallback } from 'react';
import {
  showUserFeedbackDialog,
  showFeedbackForError,
  UserReportableError,
} from '@/lib/sentry/feedback';

export interface BugReportState {
  isModalOpen: boolean;
  eventId?: string;
  prefilledData?: {
    title?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high';
  };
}

/**
 * Hook for managing bug reporting functionality
 */
export function useBugReport() {
  const [state, setState] = useState<BugReportState>({
    isModalOpen: false,
  });

  // Open the bug report modal with optional prefilled data
  const openBugReport = useCallback(
    (options?: {
      eventId?: string;
      title?: string;
      description?: string;
      severity?: 'low' | 'medium' | 'high';
    }) => {
      setState({
        isModalOpen: true,
        eventId: options?.eventId,
        prefilledData: {
          title: options?.title,
          description: options?.description,
          severity: options?.severity,
        },
      });
    },
    [],
  );

  // Close the bug report modal
  const closeBugReport = useCallback(() => {
    setState({
      isModalOpen: false,
    });
  }, []);

  // Show the native Sentry feedback dialog
  const showSentryDialog = useCallback(
    (options?: { title?: string; subtitle?: string; eventId?: string }) => {
      showUserFeedbackDialog(options);
    },
    [],
  );

  // Report an error and optionally show feedback dialog
  const reportError = useCallback(
    (
      error: Error,
      options?: {
        component?: string;
        action?: string;
        showDialog?: boolean;
        additionalData?: Record<string, unknown>;
      },
    ) => {
      if (options?.showDialog) {
        return showFeedbackForError(error, {
          component: options.component,
          action: options.action,
          additionalData: options.additionalData,
        });
      } else {
        // Just capture the error without showing dialog
        const reportableError = new UserReportableError(error.message, {
          component: options?.component,
          action: options?.action,
          showFeedbackDialog: false,
        });
        return reportableError.eventId;
      }
    },
    [],
  );

  // Create a reportable error that automatically shows feedback dialog
  const createReportableError = useCallback(
    (
      message: string,
      context?: {
        component?: string;
        action?: string;
        severity?: 'low' | 'medium' | 'high';
      },
    ) => {
      return new UserReportableError(message, context);
    },
    [],
  );

  return {
    // State
    isModalOpen: state.isModalOpen,
    eventId: state.eventId,
    prefilledData: state.prefilledData,

    // Actions
    openBugReport,
    closeBugReport,
    showSentryDialog,
    reportError,
    createReportableError,
  };
}

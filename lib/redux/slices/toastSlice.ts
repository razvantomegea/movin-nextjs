import React from 'react';
import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode; // Added for compatibility with existing code
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

const TOAST_LIMIT = 5;
const DEFAULT_TOAST_DURATION = 5000; // 5 seconds

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        // Add toast to the beginning of the array and limit the number of toasts
        state.toasts = [action.payload, ...state.toasts].slice(0, TOAST_LIMIT);
      },
      prepare: (toast: Omit<Toast, 'id'> & { id?: string }) => {
        return {
          payload: {
            id: toast.id || nanoid(),
            title: toast.title,
            description: toast.description,
            variant: toast.variant || 'default',
            duration: toast.duration || DEFAULT_TOAST_DURATION,
            action: toast.action,
          },
        };
      },
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      // Find the toast by ID and mark it as dismissed
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    dismissAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, dismissToast, dismissAllToasts } = toastSlice.actions;

// Action creators for specific toast types
export const showSuccessToast = (toast: Omit<Toast, 'id' | 'variant'>) =>
  addToast({ ...toast, variant: 'success' });

export const showErrorToast = (toast: Omit<Toast, 'id' | 'variant'>) =>
  addToast({ ...toast, variant: 'destructive' });

export const showWarningToast = (toast: Omit<Toast, 'id' | 'variant'>) =>
  addToast({ ...toast, variant: 'warning' });

export const showInfoToast = (toast: Omit<Toast, 'id' | 'variant'>) =>
  addToast({ ...toast, variant: 'info' });

// Export a toast function for compatibility with existing code
export const toast = (props: Omit<Toast, 'id'>) => addToast(props);

export default toastSlice.reducer;

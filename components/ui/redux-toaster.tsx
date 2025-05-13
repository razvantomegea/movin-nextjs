'use client';

import { useEffect } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { dismissToast } from '@/lib/redux/slices/toastSlice';

export function ReduxToaster() {
  const dispatch = useAppDispatch();
  const { toasts } = useAppSelector((state) => state.toast);

  // Set up auto-dismiss for toasts based on their duration
  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration) {
        const timer = setTimeout(() => {
          dispatch(dismissToast(toast.id));
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [toasts, dispatch]);

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, action }) => (
        <Toast key={id} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose onClick={() => dispatch(dismissToast(id))} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

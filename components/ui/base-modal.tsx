import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  preventBackdropClose?: boolean;
  fullMobile?: boolean;
  'data-testid'?: string;
}

const maxWidthClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  preventBackdropClose = false,
  fullMobile = true,
  'data-testid': dataTestId,
}: BaseModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />

          {/* Modal Content */}
          <motion.div
            className={cn(
              fullMobile && 'w-full h-full sm:h-auto sm:rounded-xl',
              !fullMobile && 'w-full h-auto',
              'relative flex flex-col',
              maxWidthClasses.xl,
              'rounded-none sm:rounded-xl',
              'overflow-hidden',
              isDark ? 'bg-gray-900' : 'bg-white',
              'shadow-xl',
              className,
            )}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            tabIndex={-1}
            role="region"
            aria-labelledby="base-modal-title"
            data-testid={dataTestId}
          >
            {/* Header */}
            <div
              className={cn(
                'flex items-center justify-between px-6 py-4 border-b flex-shrink-0',
                isDark ? 'border-gray-800' : 'border-gray-200',
                headerClassName,
              )}
            >
              <div className="flex-1 pr-4">
                <h2 id="base-modal-title" className="text-xl font-bold truncate leading-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p
                    className={cn(
                      'text-sm mt-1 leading-tight',
                      isDark ? 'text-gray-400' : 'text-gray-500',
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Body */}
            <div className={cn('flex-1 overflow-y-auto min-h-0', contentClassName)}>{children}</div>

            {/* Footer */}
            {footer && (
              <div
                className={cn(
                  'flex-shrink-0 border-t safe-bottom',
                  isDark ? 'border-gray-800' : 'border-gray-200',
                  footerClassName,
                )}
              >
                {footer}
              </div>
            )}

            {/* Mobile-only bottom padding for safe area when no footer */}
            {!footer && <div className="h-4 sm:hidden safe-bottom"></div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

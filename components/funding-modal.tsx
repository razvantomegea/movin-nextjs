'use client';

import { useState, useEffect } from 'react';
import { Wallet, Zap, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';
import { DataTestIds } from '@/constants';

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function FundingModal({ isOpen, onClose, isLoading, error, onRetry }: FundingModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [dots, setDots] = useState('');

  // Animate loading dots
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={error ? 'Funding Failed' : 'Funding Your Wallet'}
      contentClassName="p-6 space-y-6"
      fullMobile={true}
      preventBackdropClose={isLoading}
      data-testid={DataTestIds.FUNDING_MODAL_CONTAINER}
    >
      <div className="flex justify-center">
        <div className={`p-6 rounded-full ${isDark ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
          {error ? (
            <AlertCircle
              className="h-16 w-16 text-red-500"
              data-testid={DataTestIds.FUNDING_MODAL_ERROR_ICON}
            />
          ) : (
            <div className="relative">
              <Wallet
                className="h-16 w-16 text-blue-500"
                data-testid={
                  isLoading
                    ? DataTestIds.FUNDING_MODAL_LOADING_ICON
                    : DataTestIds.FUNDING_MODAL_SUCCESS_ICON
                }
              />
              {isLoading && (
                <div className="absolute -top-2 -right-2">
                  <Zap className="h-8 w-8 text-yellow-500 animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-center space-y-2">
        {error ? (
          <>
            <h3
              className="text-xl font-bold text-red-600 dark:text-red-400"
              data-testid={DataTestIds.FUNDING_MODAL_TITLE}
            >
              Unable to Fund Wallet
            </h3>
            <p
              className="text-gray-600 dark:text-gray-400"
              data-testid={DataTestIds.FUNDING_MODAL_DESCRIPTION}
            >
              {error}
            </p>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'} mt-4`}>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can still proceed with the transaction if you have sufficient ETH in your
                wallet, or try funding again.
              </p>
            </div>
          </>
        ) : isLoading ? (
          <>
            <h3 className="text-xl font-bold" data-testid={DataTestIds.FUNDING_MODAL_TITLE}>
              Funding Your Wallet
              <span data-testid={DataTestIds.FUNDING_MODAL_LOADING_DOTS}>{dots}</span>
            </h3>
            <p
              className="text-gray-500 dark:text-gray-400"
              data-testid={DataTestIds.FUNDING_MODAL_DESCRIPTION}
            >
              We&apos;re sending 0.00001 ETH to your wallet for gas fees
            </p>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} mt-4`}>
              <div className="flex items-center justify-center space-x-2 mb-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This usually takes a few seconds. Please wait while we process the transaction.
              </p>
            </div>
          </>
        ) : (
          <>
            <h3
              className="text-xl font-bold text-green-600 dark:text-green-400"
              data-testid={DataTestIds.FUNDING_MODAL_TITLE}
            >
              Wallet Funded Successfully!
            </h3>
            <p
              className="text-gray-500 dark:text-gray-400"
              data-testid={DataTestIds.FUNDING_MODAL_DESCRIPTION}
            >
              0.00001 ETH has been added to your wallet for gas fees
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex flex-col space-y-3 pt-4">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="w-full"
              data-testid={DataTestIds.FUNDING_MODAL_TRY_AGAIN_BUTTON}
            >
              <Zap className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
            data-testid={DataTestIds.FUNDING_MODAL_CONTINUE_ANYWAY_BUTTON}
          >
            Continue Anyway
          </Button>
        </div>
      )}

      {!error && !isLoading && (
        <div className="pt-4">
          <Button
            onClick={handleClose}
            className="w-full"
            data-testid={DataTestIds.FUNDING_MODAL_CONTINUE_BUTTON}
          >
            Continue
          </Button>
        </div>
      )}
    </BaseModal>
  );
}

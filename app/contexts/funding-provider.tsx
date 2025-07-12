'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { createWalletClient, http, publicActions } from 'viem';
import { base } from 'viem/chains';
import { FundingModal } from '@/components/funding-modal';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';

interface FundingContextType {
  checkAndFundWallet: () => Promise<boolean>;
  isFundingModalOpen: boolean;
  isFunding: boolean;
  fundingError: string | null;
}

const FundingContext = createContext<FundingContextType | undefined>(undefined);

export function useFunding() {
  const context = useContext(FundingContext);
  if (context === undefined) {
    throw new Error('useFunding must be used within a FundingProvider');
  }
  return context;
}

interface FundingProviderProps {
  children: React.ReactNode;
}

export function FundingProvider({ children }: FundingProviderProps) {
  const { address, isConnected } = useAppKitAccount();
  const dispatch = useAppDispatch();
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);

  const checkAndFundWallet = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      return false;
    }

    try {
      // Get environment variables
      const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;

      if (!infuraId) {
        console.error('NEXT_PUBLIC_INFURA_ID environment variable is not set');
        return false;
      }

      const rpcUrl = `https://base-mainnet.infura.io/v3/${infuraId}`;

      // Create public client to check balance
      const publicClient = createWalletClient({
        chain: base,
        transport: http(rpcUrl),
      }).extend(publicActions);

      // Check user's current balance
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

      // If balance is 0, attempt to fund the wallet
      if (balance === BigInt(0)) {
        setIsFundingModalOpen(true);
        setIsFunding(true);
        setFundingError(null);

        try {
          // Get the JWT token from localStorage
          const authTokenData = localStorage.getItem('auth_token');
          const authToken = authTokenData ? JSON.parse(authTokenData).token : null;

          if (!authToken) {
            throw new Error('No authentication token found');
          }

          const response = await fetch('/api/fund-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to fund wallet');
          }

          setIsFunding(false);

          // Show success toast
          dispatch(
            showSuccessToast({
              title: 'Wallet Funded',
              description: data.message || '0.0001 ETH received for gas fees',
            }),
          );

          // Close modal after a short delay to show success state
          setTimeout(() => {
            setIsFundingModalOpen(false);
          }, 1500);

          return true;
        } catch (error) {
          setIsFunding(false);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setFundingError(errorMessage);

          dispatch(
            showErrorToast({
              title: 'Funding Failed',
              description: errorMessage,
            }),
          );

          return false;
        }
      }

      // Wallet already has funds
      return true;
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return false;
    }
  }, [address, isConnected, dispatch]);

  const handleRetryFunding = useCallback(async () => {
    setFundingError(null);
    await checkAndFundWallet();
  }, [checkAndFundWallet]);

  const handleCloseFundingModal = useCallback(() => {
    setIsFundingModalOpen(false);
    setFundingError(null);
  }, []);

  const contextValue: FundingContextType = {
    checkAndFundWallet,
    isFundingModalOpen,
    isFunding,
    fundingError,
  };

  return (
    <FundingContext.Provider value={contextValue}>
      {children}
      <FundingModal
        isOpen={isFundingModalOpen}
        onClose={handleCloseFundingModal}
        isLoading={isFunding}
        error={fundingError}
        onRetry={handleRetryFunding}
      />
    </FundingContext.Provider>
  );
}

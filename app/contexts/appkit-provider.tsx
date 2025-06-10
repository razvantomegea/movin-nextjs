'use client';

import React, { type ReactNode } from 'react';
import { base } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';
import { projectId, wagmiAdapter } from '@/config';

const queryClient = new QueryClient();

const metadata = {
  name: 'Movin',
  description: 'Your effort counts',
  url: 'https://app.getmovin.ai', // Must match your deployed domain
  icons: [
    '/icons/icon-only.png',
    '/icons/icon-48.webp',
    '/icons/icon-72.webp',
    '/icons/icon-96.webp',
    '/icons/icon-128.webp',
    '/icons/icon-192.webp',
    '/icons/icon-256.webp',
    '/icons/icon-512.webp',
  ],
};

// Initialize AppKit only if we have a valid project ID
if (!projectId) {
  console.error('AppKit Initialization Error: Project ID is missing.');
  console.error('Please ensure NEXT_PUBLIC_REOWN_PROJECT_ID is set in your .env.local file');
} else {
  console.log('Initializing AppKit with project ID:', projectId);

  try {
    createAppKit({
      adapters: [wagmiAdapter],
      projectId,
      networks: [base],
      defaultNetwork: base,
      metadata: metadata,
      features: {
        analytics: true,
        socials: ['apple', 'google'],
        email: true,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-color-mix': '#1f2937',
        '--w3m-color-mix-strength': 20,
      },
      enableWalletConnect: true,
      enableInjected: true,
      enableEIP6963: true,
      enableCoinbase: true,
    });
    console.log('AppKit initialized successfully');
  } catch (error) {
    console.error('AppKit initialization failed:', error);
  }
}

export default function AppkitProvider({ children }: { children: ReactNode }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, '');

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

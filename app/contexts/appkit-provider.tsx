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
  description: 'Earn while you burn',
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

if (!projectId) {
  console.error('AppKit Initialization Error: Project ID is missing.');
  // Optionally throw an error or render fallback UI
} else {
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
  });
}

export default function AppkitProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

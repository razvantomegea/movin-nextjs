'use client';

import dynamic from 'next/dynamic';

// Dynamically import the PWA handler component to avoid SSR issues
const PWAHandler = dynamic(() => import('./PWAHandler'), {
  ssr: false,
});

export default function ClientPWAHandler() {
  return <PWAHandler />;
}

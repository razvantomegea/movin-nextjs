import type React from 'react';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';

import Script from 'next/script';
import AppkitProvider from '@/app/contexts/appkit-provider';
import { GoogleMapsProvider } from '@/app/contexts/google-maps-provider';
import { ThemeProvider } from '@/app/contexts/theme-provider';
import { FloatingBugReportButton } from '@/components/feedback';
import { ReduxToaster } from '@/components/ui/redux-toaster';
import { ReduxProvider } from '@/lib/redux/provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Movin App',
  description: 'Move to earn app',
  generator: 'v0.dev',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {adsenseClientId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GoogleMapsProvider>
              <AppkitProvider>{children}</AppkitProvider>
              <ReduxToaster />
              <FloatingBugReportButton />
              <Analytics />
            </GoogleMapsProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

import type { ReactNode } from 'react';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import AppkitProvider from '@/app/contexts/appkit-provider';
import { GoogleMapsProvider } from '@/app/contexts/google-maps-provider';
import { ThemeProvider } from '@/app/contexts/theme-provider';
import { FloatingBugReportButton } from '@/components/feedback';
import ClientPWAHandler from '@/components/ui/ClientPWAHandler';
import { ReduxToaster } from '@/components/ui/redux-toaster';
import { ReduxProvider } from '@/lib/redux/provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Movin App',
  description: 'Move to earn app',
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Movin',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow zoom for accessibility (recommended)
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
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
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
      </head>
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GoogleMapsProvider>
              <AppkitProvider>
                {children}
                <ClientPWAHandler />
              </AppkitProvider>
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

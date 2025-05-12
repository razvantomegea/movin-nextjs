import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/app/contexts/theme-provider';
import { ReduxProvider } from '@/lib/redux/provider';
import { GoogleMapsProvider } from '@/app/contexts/google-maps-provider';
import { ReduxToaster } from '@/components/ui/redux-toaster';
import { headers } from 'next/headers';
import AppkitProvider from '@/app/contexts/appkit-provider';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Movin App',
  description: 'Move to earn app',
  generator: 'v0.dev',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GoogleMapsProvider>
              <AppkitProvider cookies={cookies}>{children}</AppkitProvider>
              <ReduxToaster />
              <Analytics />
            </GoogleMapsProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

import type { ReactNode } from 'react';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import AppkitProvider from '@/app/contexts/appkit-provider';
import { GoogleMapsProvider } from '@/app/contexts/google-maps-provider';
import { ThemeProvider } from '@/app/contexts/theme-provider';
import { FloatingBugReportButton } from '@/components/feedback';
import { ReduxToaster } from '@/components/ui/redux-toaster';
import { ReduxProvider } from '@/lib/redux/provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://app.getmovin.ai'),
  title: {
    default: 'Movin - Your Effort Counts',
    template: `%s | Movin`,
  },
  description:
    'Track your fitness, earn rewards, and stay motivated with Movin. An innovative fitness app that rewards your effort.',
  generator: 'Next.js',
  applicationName: 'Movin',
  referrer: 'origin-when-cross-origin',
  keywords: ['Fitness', 'Health', 'Workout', 'Rewards', 'Blockchain', 'Crypto'],
  authors: [{ name: 'Razvan Tomegea', url: 'https://github.com/razvantomegea' }],
  creator: 'Razvan Tomegea',
  publisher: 'Movin',
  manifest: '/manifest',
  openGraph: {
    title: 'Movin - Your Effort Counts',
    description:
      'Track your fitness, earn rewards, and stay motivated with Movin. An innovative fitness app that rewards your effort.',
    url: 'https://app.getmovin.ai',
    siteName: 'Movin',
    images: [
      {
        url: 'https://app.getmovin.ai/images/logo.png', // Must be an absolute URL
        width: 800,
        height: 600,
        alt: 'Movin App Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movin - Your Effort Counts',
    description:
      'Track your fitness, earn rewards, and stay motivated with Movin. An innovative fitness app that rewards your effort.',
    images: ['https://app.getmovin.ai/images/logo.png'], // Must be an absolute URL
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Movin',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Movin" />
        <link rel="apple-touch-icon" href="/icons/icon-192.webp" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Movin',
              url: 'https://app.getmovin.ai',
            }),
          }}
        />
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

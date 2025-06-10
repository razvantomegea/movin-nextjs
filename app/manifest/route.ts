import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    name: 'Movin',
    short_name: 'Movin',
    description: 'Your effort counts',
    start_url: '/',
    display: 'standalone',
    background_color: '#111827',
    theme_color: '#111827',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-72.webp',
        sizes: '72x72',
        type: 'image/webp',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-96.webp',
        sizes: '96x96',
        type: 'image/webp',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-128.webp',
        sizes: '128x128',
        type: 'image/webp',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-192.webp',
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-256.webp',
        sizes: '256x256',
        type: 'image/webp',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-512.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'maskable any',
      },
    ],
    categories: ['fitness', 'health', 'lifestyle'],
    screenshots: [],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your fitness dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-96.webp', sizes: '96x96' }],
      },
      {
        name: 'Rewards',
        short_name: 'Rewards',
        description: 'View your rewards and achievements',
        url: '/dashboard/rewards',
        icons: [{ src: '/icons/icon-96.webp', sizes: '96x96' }],
      },
      {
        name: 'Profile',
        short_name: 'Profile',
        description: 'Manage your profile and view stats',
        url: '/dashboard/profile',
        icons: [{ src: '/icons/icon-96.webp', sizes: '96x96' }],
      },
      {
        name: 'Settings',
        short_name: 'Settings',
        description: 'Configure app preferences',
        url: '/dashboard/settings',
        icons: [{ src: '/icons/icon-96.webp', sizes: '96x96' }],
      },
    ],
  });
}

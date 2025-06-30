import { type Metadata } from 'next';
import { ConnectPage } from '@/components/connect-page';

export const metadata: Metadata = {
  title: 'Movin - Your effort counts',
  description:
    'Movin is a platform for tracking your fitness, earning rewards, and achieving your goals.',
  openGraph: {
    title: 'Movin - Your effort counts',
    description:
      'Movin is a platform for tracking your fitness, earning rewards, and achieving your goals.',
  },
  twitter: {
    title: 'Movin - Your effort counts',
    description:
      'Movin is a platform for tracking your fitness, earning rewards, and achieving your goals.',
  },
};

export default function Home() {
  return <ConnectPage />;
}

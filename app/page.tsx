import { type Metadata } from 'next';
import { ConnectPage } from '@/components/connect-page';

export const metadata: Metadata = {
  title: 'Connect and Start Your Journey',
  description:
    'Connect your wallet to start tracking your fitness, earning rewards, and achieving your goals with Movin.',
  openGraph: {
    title: 'Connect and Start Your Journey | Movin',
    description:
      'Connect your wallet to start tracking your fitness, earning rewards, and achieving your goals with Movin.',
  },
  twitter: {
    title: 'Connect and Start Your Journey | Movin',
    description:
      'Connect your wallet to start tracking your fitness, earning rewards, and achieving your goals with Movin.',
  },
};

export default function Home() {
  return <ConnectPage />;
}

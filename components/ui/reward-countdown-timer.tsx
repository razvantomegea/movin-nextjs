'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

interface RewardCountdownTimerProps {
  expirationTimestamp: number | null; // Unix timestamp in seconds
  hasRewards: boolean;
}

export function RewardCountdownTimer({
  expirationTimestamp,
  hasRewards,
}: RewardCountdownTimerProps) {
  const [displayTime, setDisplayTime] = useState<string | null>(null);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);
  const [urgencyClass, setUrgencyClass] = useState('text-gray-400');

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const updateDisplay = () => {
      if (!hasRewards || !expirationTimestamp) {
        setDisplayTime(null);
        setShowExpiredMessage(false);
        setUrgencyClass('text-gray-400');
        return;
      }

      const now = new Date().getTime();
      const expirationTime = expirationTimestamp * 1000;
      const remainingTime = expirationTime - now;

      if (remainingTime <= 0) {
        setDisplayTime(null);
        setShowExpiredMessage(true);
        setUrgencyClass('text-red-500');
        if (intervalId) {
          clearInterval(intervalId);
        }
      } else {
        const seconds = Math.floor((remainingTime / 1000) % 60);
        const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
        const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);

        setDisplayTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        setShowExpiredMessage(false);

        if (remainingTime < 1 * 60 * 60 * 1000) {
          // Less than 1 hour
          setUrgencyClass('text-red-500');
        } else if (remainingTime < 6 * 60 * 60 * 1000) {
          // Less than 6 hours
          setUrgencyClass('text-amber-500');
        } else {
          setUrgencyClass('text-blue-400');
        }
      }
    };

    updateDisplay(); // Initial update

    if (expirationTimestamp && hasRewards) {
      intervalId = setInterval(updateDisplay, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [expirationTimestamp, hasRewards]);

  const pad = (num: number): string => {
    return num < 10 ? '0' + num : num.toString();
  };

  if (displayTime === null && !showExpiredMessage) {
    return null;
  }

  return (
    <div className="flex items-center mt-1">
      {displayTime !== null && (
        <div className={cn('flex items-center', urgencyClass)}>
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{displayTime}</span>
          <span className="text-xs ml-2 text-gray-400">until expiration</span>
        </div>
      )}
      {displayTime === null && showExpiredMessage && (
        <div className="flex items-center text-red-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Rewards expired</span>
        </div>
      )}
    </div>
  );
}

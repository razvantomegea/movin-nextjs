'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: Date | string;
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({ endDate, onComplete, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isComplete, setIsComplete] = useState(false);
  const onCompleteCalledRef = useRef(false);

  useEffect(() => {
    // Convert string date to Date object if needed
    const targetDate = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsComplete(true);
        if (onComplete && !onCompleteCalledRef.current) {
          onCompleteCalledRef.current = true;
          onComplete();
        }
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onComplete]);

  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Clock className="h-4 w-4 mr-1 text-blue-500" />
      {isComplete ? (
        <span className="text-green-500">Unlocked</span>
      ) : (
        <div className="text-sm">
          {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
          <span>
            {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:
            {formatNumber(timeLeft.seconds)}
          </span>
        </div>
      )}
    </div>
  );
}

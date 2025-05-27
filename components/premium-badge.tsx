'use client';

import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';

export function PremiumBadge() {
  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive, isLoading, error } = usePremiumStatus();

  if (isLoading) {
    return <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>;
  }

  if (!isPremiumActive() || error) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center h-5 w-5">
            <Crown className="h-5 w-5 text-yellow-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Premium Member</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

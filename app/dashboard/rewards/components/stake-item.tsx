'use client';

import { useState } from 'react';
import { Lock, TrendingUp, Unlock } from 'lucide-react';
import { CountdownTimer } from '@/components/countdown-timer';
import { LoadingButton } from '@/components/ui/loading-button';
import { IUserStake } from '@/lib/hooks/useMovinEarn';
import { UnstakeWarningModal } from './unstake-warning-modal';

interface StakeItemProps {
  stake: IUserStake;
  index: number;
  isDark: boolean;
  tokenSymbol: string;
  activeAction: { type: string; index: number } | null;
  onUnstake: (index: number) => Promise<void>;
  onRestake: (index: number, lockMonths: number) => Promise<void>;
  onStakeUnlocked: (amount: string) => void;
  rewardsEarned?: number;
}

export function StakeItem({
  stake,
  index,
  isDark,
  tokenSymbol,
  activeAction,
  onUnstake,
  onRestake,
  onStakeUnlocked,
  rewardsEarned,
}: StakeItemProps) {
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const aprValue = parseInt(stake.lockDurationFormatted) / 30;
  const endDateISO = new Date(stake.endTime * 1000).toISOString();
  const displayTokenSymbol = tokenSymbol || 'MVN';

  const handleUnstakeClick = () => {
    setIsWarningModalOpen(true);
  };

  const handleModalUnstake = async () => {
    await onUnstake(index);
  };

  const handleModalRestake = async (lockMonths: number) => {
    await onRestake(index, lockMonths);
  };

  const handleCloseModal = () => {
    setIsWarningModalOpen(false);
  };

  return (
    <div
      className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Lock className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">
            {Number(stake.amount).toFixed(2)} {displayTokenSymbol}
          </span>
        </div>
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
          <span className="text-green-500 font-medium">{aprValue} Month APR</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Lock Period</span>
        <span>{stake.lockDurationFormatted}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Pending Rewards</span>
        <span className="text-blue-500">
          +{Number(stake.reward).toFixed(2)} {displayTokenSymbol}
        </span>
      </div>

      {typeof rewardsEarned === 'number' && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Rewards earned</span>
          <span className="text-green-500 font-medium">
            +{Number(rewardsEarned).toFixed(2)} {displayTokenSymbol}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
        {stake.canUnstake ? (
          <div className="flex justify-between w-full">
            <span className="text-sm text-green-500">Ready to unstake</span>
            <LoadingButton
              variant="outline"
              size="sm"
              className="text-green-500 border-green-500"
              loading={activeAction?.type === 'unstake' && activeAction?.index === index}
              loadingText="Unstaking..."
              onClick={handleUnstakeClick}
              disabled={activeAction != null}
            >
              <Unlock className="h-4 w-4 mr-1" />
              Unstake
            </LoadingButton>
          </div>
        ) : (
          <>
            <span className="text-sm text-gray-500">Unlocks in</span>
            <CountdownTimer
              endDate={endDateISO}
              className="text-sm"
              onComplete={() => onStakeUnlocked(stake.amount)}
            />
          </>
        )}
      </div>

      {/* Unstake Warning Modal */}
      <UnstakeWarningModal
        isOpen={isWarningModalOpen}
        onClose={handleCloseModal}
        stake={stake}
        tokenSymbol={displayTokenSymbol}
        onUnstake={handleModalUnstake}
        onRestake={handleModalRestake}
        isProcessing={activeAction?.type === 'unstake' && activeAction?.index === index}
      />
    </div>
  );
}

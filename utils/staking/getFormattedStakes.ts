import { formatUnits, parseUnits } from 'viem';
import { IStakeRewards, IUserStake, IUserStakeAbi } from '@/lib/hooks/useMovinEarn';

export const getFormattedStakes = ({
  stakes,
  rewardsPercentageFee,
}: {
  stakes?: IUserStakeAbi[];
  rewardsPercentageFee: number;
}): IStakeRewards => {
  const formattedStakes: Array<IUserStake> = [];
  let totalStaked = parseUnits('0', 18);
  let totalStakingRewards = 0;

  if (!stakes) {
    return {
      stakes: [],
      totalStaked: totalStaked.toString(),
      totalStakingRewards: totalStakingRewards.toString(),
      rewardsPercentageFee,
    };
  }

  for (const stake of stakes) {
    const stakeRewards = formatUnits(stake.rewards, 18);
    totalStaked = totalStaked + stake.amount;

    // Safely convert bigints to numbers for calculations
    const startTimeNum = Number(stake.startTime);
    const lockDurationNum = Number(stake.lockDuration);

    // Calculate end time using numbers
    const endTime = startTimeNum + lockDurationNum;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, endTime - now);

    // Format times using numbers
    const startDate = new Date(startTimeNum * 1000);
    const endDate = new Date(endTime * 1000);

    // Format durations using numbers
    const durationDays = Math.floor(lockDurationNum / 86400);
    const remainingDays = Math.floor(timeRemaining / 86400);
    const remainingHours = Math.floor((timeRemaining % 86400) / 3600);

    formattedStakes.push({
      amount: formatUnits(stake.amount, 18),
      startTime: startTimeNum,
      startTimeFormatted: startDate.toLocaleDateString(),
      lockDuration: lockDurationNum,
      lockDurationFormatted: `${durationDays} days`,
      endTime: endTime,
      endTimeFormatted: endDate.toLocaleDateString(),
      timeRemaining: timeRemaining,
      timeRemainingFormatted:
        timeRemaining > 0 ? `${remainingDays}d ${remainingHours}h` : 'Unlocked',
      reward: stakeRewards,
      canUnstake: timeRemaining === 0,
      lastClaimed: stake.lastClaimed,
    });

    totalStakingRewards += parseFloat(stakeRewards);
  }

  return {
    stakes: formattedStakes,
    totalStaked: formatUnits(totalStaked, 18),
    totalStakingRewards: totalStakingRewards.toString(),
    rewardsPercentageFee,
  };
};

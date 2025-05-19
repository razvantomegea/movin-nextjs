import { IUserStake } from '@/lib/hooks/useMovinEarn';
import { IStake } from '@/lib/supabase/stake';

export const mapUserStakeToDB = (
  userStake: IUserStake,
  address: string,
  isUnstaked = false,
): Partial<IStake> => {
  const lockPeriodMonths = parseInt(userStake.lockDurationFormatted) / 30;

  // Convert Unix timestamps to ISO strings for PostgreSQL
  const startTimeISO = new Date(userStake.startTime * 1000).toISOString();
  const unstakeTimeISO = isUnstaked ? new Date(Date.now()).toISOString() : null;

  return {
    id: '',
    address,
    amount: Number(userStake.amount),
    rewards: Number(userStake.reward),
    stake_time: startTimeISO,
    unstake_time: unstakeTimeISO,
    lock_period_months: lockPeriodMonths,
    apr: lockPeriodMonths,
    is_active: !isUnstaked,
  };
};

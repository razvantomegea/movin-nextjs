import { IUserStake } from '@/lib/hooks/useMovinEarn';
import { IStake } from '@/lib/supabase/stake';

export function matchUserStakeWithDB(userStake: IUserStake, dbStake: IStake) {
  const userStakeTime = new Date(userStake.startTime).getTime();
  const dbStakeTime = new Date(dbStake.stake_time).getTime();
  const userStakeTimeDiff = userStakeTime - dbStakeTime;

  return (
    Number(userStake.amount) === dbStake.amount &&
    parseInt(userStake.lockDurationFormatted) / 30 === dbStake.lock_period_months &&
    userStakeTimeDiff < 5 * 60 * 1000
  );
}

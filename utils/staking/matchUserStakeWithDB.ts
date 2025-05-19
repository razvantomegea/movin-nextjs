import { IUserStake } from '@/lib/hooks/useMovinEarn';
import { IStake } from '@/lib/supabase/stake';

export function matchUserStakeWithDB(userStake: IUserStake, dbStake: IStake) {
  return (
    Number(userStake.amount) === dbStake.amount &&
    parseInt(userStake.lockDurationFormatted) / 30 === dbStake.lock_period_months
  );
}

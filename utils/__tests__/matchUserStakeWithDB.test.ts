import { matchUserStakeWithDB } from '../staking/matchUserStakeWithDB';
import { IUserStake } from '@/lib/hooks/useMovinEarn';
import { IStake } from '@/lib/supabase/stake';

describe('matchUserStakeWithDB', () => {
  const baseUserStake: IUserStake = {
    amount: '100',
    startTime: 1718000000000,
    startTimeFormatted: '',
    lockDuration: 90,
    lockDurationFormatted: '90',
    endTime: 0,
    endTimeFormatted: '',
    timeRemaining: 0,
    timeRemainingFormatted: '',
    reward: '0',
    canUnstake: false,
    lastClaimed: BigInt(0),
  };

  const baseDbStake: IStake = {
    id: '1',
    address: '0xabc',
    amount: 100,
    rewards: 0,
    stake_time: new Date(1718000000000).toISOString(),
    unstake_time: null,
    lock_period_months: 3,
    apr: 10,
    is_active: true,
    created_at: '',
    updated_at: '',
  };

  it('returns true for matching stakes (within 5 min)', () => {
    const userStake = { ...baseUserStake, startTime: 1718000000000 };
    const dbStake = { ...baseDbStake, stake_time: new Date(1718000000000).toISOString() };
    expect(matchUserStakeWithDB(userStake, dbStake)).toBe(true);
  });

  it('returns false if amount does not match', () => {
    const userStake = { ...baseUserStake, amount: '200' };
    expect(matchUserStakeWithDB(userStake, baseDbStake)).toBe(false);
  });

  it('returns false if lock duration does not match', () => {
    const userStake = { ...baseUserStake, lockDurationFormatted: '60' };
    expect(matchUserStakeWithDB(userStake, baseDbStake)).toBe(false);
  });

  it('returns false if startTime is more than 5 min apart', () => {
    const userStake = { ...baseUserStake, startTime: 1718000000000 + 10 * 60 * 1000 };
    expect(matchUserStakeWithDB(userStake, baseDbStake)).toBe(false);
  });

  it('returns true if startTime is less than 5 min apart', () => {
    const userStake = { ...baseUserStake, startTime: 1718000000000 + 2 * 60 * 1000 };
    expect(matchUserStakeWithDB(userStake, baseDbStake)).toBe(true);
  });
});

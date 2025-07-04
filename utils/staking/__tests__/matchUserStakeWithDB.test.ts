import { matchUserStakeWithDB } from '../matchUserStakeWithDB';

describe('matchUserStakeWithDB', () => {
  it('should match stakes with close times and same amount/lock', () => {
    const now = Date.now();
    const userStake = {
      amount: '1.0',
      reward: '0.5',
      startTime: now,
      startTimeFormatted: '',
      lockDuration: 86400 * 30,
      lockDurationFormatted: '30',
      endTime: now + 86400 * 30 * 1000,
      endTimeFormatted: '',
      timeRemaining: 0,
      timeRemainingFormatted: '',
      canUnstake: true,
      lastClaimed: 0,
    };
    const dbStake = {
      id: '1',
      address: 'erd1...',
      amount: 1,
      rewards: 0.5,
      stake_time: new Date(now).toISOString(),
      unstake_time: null,
      lock_period_months: 1,
      apr: 1,
      is_active: true,
    };
    expect(matchUserStakeWithDB(userStake, dbStake)).toBe(true);
  });

  it('should not match if amount is different', () => {
    const now = Date.now();
    const userStake = {
      amount: '2.0',
      reward: '0.5',
      startTime: now,
      startTimeFormatted: '',
      lockDuration: 86400 * 30,
      lockDurationFormatted: '30',
      endTime: now + 86400 * 30 * 1000,
      endTimeFormatted: '',
      timeRemaining: 0,
      timeRemainingFormatted: '',
      canUnstake: true,
      lastClaimed: 0,
    };
    const dbStake = {
      id: '1',
      address: 'erd1...',
      amount: 1,
      rewards: 0.5,
      stake_time: new Date(now).toISOString(),
      unstake_time: null,
      lock_period_months: 1,
      apr: 1,
      is_active: true,
    };
    expect(matchUserStakeWithDB(userStake, dbStake)).toBe(false);
  });
});

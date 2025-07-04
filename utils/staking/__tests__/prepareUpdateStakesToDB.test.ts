import { prepareUpdateStakesInDB } from '../prepareUpdateStakesToDB';

describe('prepareUpdateStakesInDB', () => {
  it('should return empty arrays if no userStakes', () => {
    const result = prepareUpdateStakesInDB({
      dbStakes: [],
      userStakes: undefined,
      address: 'erd1...',
    });
    expect(result.stakesToCreate).toEqual([]);
    expect(result.stakesToUpdate).toEqual([]);
  });

  it('should add new blockchain stake if not in DB', () => {
    const userStake = {
      amount: '1.0',
      reward: '0.5',
      startTime: Date.now(),
      startTimeFormatted: '',
      lockDuration: 86400 * 30,
      lockDurationFormatted: '30',
      endTime: Date.now() + 86400 * 30 * 1000,
      endTimeFormatted: '',
      timeRemaining: 0,
      timeRemainingFormatted: '',
      canUnstake: true,
      lastClaimed: BigInt(0),
    };
    const result = prepareUpdateStakesInDB({
      dbStakes: [],
      userStakes: [userStake],
      address: 'erd1...',
    });
    expect(result.stakesToCreate.length).toBe(1);
    expect(result.stakesToUpdate.length).toBe(0);
  });

  it('should update stake if already in DB', () => {
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
      lastClaimed: BigInt(0),
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
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    };
    const result = prepareUpdateStakesInDB({
      dbStakes: [dbStake],
      userStakes: [userStake],
      address: 'erd1...',
    });
    expect(result.stakesToCreate.length).toBe(0);
    expect(result.stakesToUpdate.length).toBe(1);
  });
});

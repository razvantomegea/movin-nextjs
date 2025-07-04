import { mapUserStakeToDB } from '../mapUserStakeToDB';

describe('mapUserStakeToDB', () => {
  it('should map user stake to DB format (active)', () => {
    const userStake = {
      amount: '1.0',
      reward: '0.5',
      startTime: Math.floor(Date.now() / 1000),
      startTimeFormatted: '2024-01-01',
      lockDuration: 86400 * 30,
      lockDurationFormatted: '30',
      endTime: Math.floor(Date.now() / 1000) + 86400 * 30,
      endTimeFormatted: '2024-02-01',
      timeRemaining: 86400 * 30,
      timeRemainingFormatted: '30d 0h',
      canUnstake: false,
      lastClaimed: BigInt(0),
      created_at: new Date(Date.now()).toISOString(),
      updated_at: new Date(Date.now()).toISOString(),
    };
    const address = 'erd1...';
    const result = mapUserStakeToDB(userStake, address);
    expect(result.address).toBe(address);
    expect(result.amount).toBe(1);
    expect(result.rewards).toBe(0.5);
    expect(typeof result.stake_time).toBe('string');
    expect(result.unstake_time).toBeNull();
    expect(result.is_active).toBe(true);
  });

  it('should set unstake_time and is_active=false if isUnstaked', () => {
    const userStake = {
      amount: '1.0',
      reward: '0.5',
      startTime: Math.floor(Date.now() / 1000),
      startTimeFormatted: '2024-01-01',
      lockDuration: 86400 * 30,
      lockDurationFormatted: '30',
      endTime: Math.floor(Date.now() / 1000) + 86400 * 30,
      endTimeFormatted: '2024-02-01',
      timeRemaining: 0,
      timeRemainingFormatted: 'Unlocked',
      canUnstake: true,
      lastClaimed: BigInt(0),
      created_at: new Date(Date.now()).toISOString(),
      updated_at: new Date(Date.now()).toISOString(),
    };
    const address = 'erd1...';
    const result = mapUserStakeToDB(userStake, address, true);
    expect(result.is_active).toBe(false);
    expect(result.unstake_time).not.toBeNull();
  });
});

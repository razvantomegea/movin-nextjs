global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

import { getFormattedStakes } from '../getFormattedStakes';

describe('getFormattedStakes', () => {
  it('should return empty results if no stakes', () => {
    const result = getFormattedStakes({ stakes: undefined, rewardsPercentageFee: 10 });
    expect(result.stakes).toEqual([]);
    expect(result.totalStaked).toBe('0');
    expect(result.totalStakingRewards).toBe('0');
    expect(result.rewardsPercentageFee).toBe(10);
  });

  it('should format a single stake correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    const stake = {
      amount: BigInt('1000000000000000000'), // 1 token
      rewards: BigInt('500000000000000000'), // 0.5 token
      startTime: BigInt(now - 86400), // 1 day ago
      lockDuration: BigInt(86400 * 2), // 2 days
      lastClaimed: BigInt(now - 3600),
    };
    const result = getFormattedStakes({ stakes: [stake], rewardsPercentageFee: 5 });
    expect(result.stakes.length).toBe(1);
    const formatted = result.stakes[0];
    expect(formatted.amount).toBe('1');
    expect(formatted.reward).toBe('0.5');
    expect(typeof formatted.startTimeFormatted).toBe('string');
    expect(typeof formatted.endTimeFormatted).toBe('string');
    expect(formatted.lockDurationFormatted).toContain('days');
    expect(formatted.timeRemainingFormatted).toMatch(/\d+d \d+h|Unlocked/);
    expect(typeof formatted.canUnstake).toBe('boolean');
    expect(formatted.lastClaimed).toBe(stake.lastClaimed);
    expect(result.totalStaked).toBe('1');
    expect(result.totalStakingRewards).toBe('0.5');
    expect(result.rewardsPercentageFee).toBe(5);
  });
});

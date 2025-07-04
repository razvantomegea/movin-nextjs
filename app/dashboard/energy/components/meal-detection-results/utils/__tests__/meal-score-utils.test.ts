import {
  getMealScoreInfo,
  getProgressBarColor,
  calculateRewardAmount,
  calculatePhotoValidationReward,
  canClaimReward,
  getSecondsToWait,
} from '../meal-score-utils';

// Mock Date.now for time-dependent tests
const REAL_DATE_NOW = Date.now;

describe('meal-score-utils', () => {
  afterEach(() => {
    global.Date.now = REAL_DATE_NOW;
  });

  describe('getMealScoreInfo', () => {
    it('returns correct info for each score range', () => {
      expect(getMealScoreInfo(95)).toMatchObject({ label: 'Exceptional', icon: '🌟' });
      expect(getMealScoreInfo(85)).toMatchObject({ label: 'Very Good', icon: '✨' });
      expect(getMealScoreInfo(75)).toMatchObject({ label: 'Good', icon: '👍' });
      expect(getMealScoreInfo(65)).toMatchObject({ label: 'Fair', icon: '⚡' });
      expect(getMealScoreInfo(55)).toMatchObject({ label: 'Average', icon: '📊' });
      expect(getMealScoreInfo(45)).toMatchObject({ label: 'Below Average', icon: '⚠️' });
      expect(getMealScoreInfo(35)).toMatchObject({ label: 'Poor', icon: '❌' });
      expect(getMealScoreInfo(10)).toMatchObject({ label: 'Very Poor', icon: '🚫' });
    });
  });

  describe('getProgressBarColor', () => {
    it('returns green for score >= 70', () => {
      expect(getProgressBarColor(70)).toBe('bg-green-500');
      expect(getProgressBarColor(100)).toBe('bg-green-500');
    });
    it('returns yellow for 50 <= score < 70', () => {
      expect(getProgressBarColor(69)).toBe('bg-yellow-500');
      expect(getProgressBarColor(50)).toBe('bg-yellow-500');
    });
    it('returns red for score < 50', () => {
      expect(getProgressBarColor(49)).toBe('bg-red-500');
      expect(getProgressBarColor(0)).toBe('bg-red-500');
    });
  });

  describe('calculateRewardAmount', () => {
    it('calculates reward as score/100, fixed to 2 decimals', () => {
      expect(calculateRewardAmount(100)).toBe('1.00');
      expect(calculateRewardAmount(75)).toBe('0.75');
      expect(calculateRewardAmount(0)).toBe('0.00');
    });
  });

  describe('calculatePhotoValidationReward', () => {
    it('adds 0.5 bonus if isValid and confidence >= 70', () => {
      expect(calculatePhotoValidationReward(80, true, 80)).toBe('1.30'); // 0.8 + 0.5
    });
    it('does not add bonus if isValid is false', () => {
      expect(calculatePhotoValidationReward(80, false, 80)).toBe('0.80');
    });
    it('does not add bonus if confidence < 70', () => {
      expect(calculatePhotoValidationReward(80, true, 60)).toBe('0.80');
    });
    it('works for zero baseScore', () => {
      expect(calculatePhotoValidationReward(0, true, 100)).toBe('0.50');
    });
  });

  describe('canClaimReward', () => {
    it('returns false if rewardAmount <= 0', () => {
      expect(canClaimReward(null, '0.00')).toBe(false);
      expect(canClaimReward(null, '-1')).toBe(false);
    });
    it('returns true if no lastClaimTimestamp and rewardAmount > 0', () => {
      expect(canClaimReward(null, '1.00')).toBe(true);
    });
    it('returns true if cooldown has passed', () => {
      const now = 1_000_000;
      global.Date.now = () => now * 1000;
      expect(canClaimReward(now - 7200, '1.00')).toBe(true);
    });
    it('returns false if cooldown not passed', () => {
      const now = 1_000_000;
      global.Date.now = () => now * 1000;
      expect(canClaimReward(now - 7199, '1.00')).toBe(false);
    });
  });

  describe('getSecondsToWait', () => {
    it('returns 0 if no lastClaimTimestamp', () => {
      expect(getSecondsToWait(null)).toBe(0);
    });
    it('returns correct seconds left if cooldown not passed', () => {
      const now = 1_000_000;
      global.Date.now = () => now * 1000;
      expect(getSecondsToWait(now - 7000)).toBe(200);
    });
    it('returns 0 if cooldown has passed', () => {
      const now = 1_000_000;
      global.Date.now = () => now * 1000;
      expect(getSecondsToWait(now - 8000)).toBe(0);
    });
  });
});

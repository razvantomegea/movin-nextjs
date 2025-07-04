import {
  generateAchievementPostContent,
  createAchievementData,
  AchievementTypeEnum,
} from '../shareAchievement';

describe('generateAchievementPostContent', () => {
  it('should generate content for steps achievement', () => {
    const achievement = {
      type: AchievementTypeEnum.steps,
      value: '10,000 steps',
      title: 'Steps Master',
    };
    const content = generateAchievementPostContent(achievement);
    expect(content).toContain('Crushed my daily steps goal');
    expect(content).toContain('10,000 steps');
  });

  it('should generate content for streak achievement', () => {
    const achievement = {
      type: AchievementTypeEnum.streak,
      value: '7 days',
      title: 'Streak Star',
      description: 'Kept moving for a week!',
    };
    const content = generateAchievementPostContent(achievement);
    expect(content).toContain('activity streak');
    expect(content).toContain('Kept moving for a week!');
  });

  it('should generate content for workout achievement', () => {
    const achievement = {
      type: AchievementTypeEnum.workout,
      value: '',
      title: 'Workout Warrior',
    };
    const content = generateAchievementPostContent(achievement);
    expect(content).toContain('completed an amazing workout session');
  });

  it('should generate content for activity_rewards achievement', () => {
    const achievement = {
      type: AchievementTypeEnum.activityRewards,
      value: '',
      title: 'Reward Earner',
      rewardAmount: '5',
      rewardCurrency: 'MOVIN',
    };
    const content = generateAchievementPostContent(achievement);
    expect(content).toContain('Earned 5 MOVIN');
    expect(content).toContain('Getting fit and earning rewards');
  });

  it('should generate content for staking_rewards achievement', () => {
    const achievement = {
      type: AchievementTypeEnum.stakingRewards,
      value: '',
      title: 'Staking Pro',
      rewardAmount: '10',
      rewardCurrency: 'MOVIN',
    };
    const content = generateAchievementPostContent(achievement);
    expect(content).toContain('Just claimed 10 MOVIN');
    expect(content).toContain('Smart investing meets fitness goals');
  });

  it('should generate content for level achievement', () => {
    const achievement = {
      type: AchievementTypeEnum.level,
      value: 'Level 5',
      title: 'Level 5',
      description: 'Reached a new milestone!',
    };
    const content = generateAchievementPostContent(achievement);
    expect(content).toContain('Level up! Just reached Level 5');
    expect(content).toContain('Reached a new milestone!');
  });

  it('should generate content for unknown achievement type (default)', () => {
    const achievement = {
      type: 'unknown' as any,
      value: '',
      title: 'Mystery Achievement',
      description: 'Surprise!',
    };
    const content = generateAchievementPostContent(achievement);
    expect(content).toContain('Achievement unlocked: Mystery Achievement');
    expect(content).toContain('Surprise!');
  });
});

describe('createAchievementData', () => {
  it('should create achievement data with all fields', () => {
    const data = createAchievementData(
      AchievementTypeEnum.steps,
      '10,000',
      'Steps Master',
      'Great job!',
      '5',
      'MOVIN',
      AchievementTypeEnum.activityRewards,
    );
    expect(data).toEqual({
      type: AchievementTypeEnum.activityRewards,
      value: '10,000',
      title: 'Steps Master',
      description: 'Great job!',
      rewardAmount: '5',
      rewardCurrency: 'MOVIN',
    });
  });

  it('should use achievementType as type if customType is not provided', () => {
    const data = createAchievementData(
      AchievementTypeEnum.workout,
      '1',
      'Workout Complete',
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(data.type).toBe('workout');
    expect(data.title).toBe('Workout Complete');
  });
});

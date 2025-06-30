/**
 * Utility functions for sharing achievements as social posts
 */

export interface AchievementData {
  type: 'steps' | 'workout' | 'streak' | 'level' | 'activity_rewards' | 'staking_rewards';
  value: string;
  title: string;
  description?: string;
  rewardAmount?: string;
  rewardCurrency?: string;
}

/**
 * Generate post content for different achievement types
 */
export function generateAchievementPostContent(achievement: AchievementData): string {
  const { type, value, title, description, rewardAmount, rewardCurrency } = achievement;

  let content = '';
  let emoji = '';

  switch (type) {
    case 'steps':
      emoji = '🏃‍♂️🎯';
      content = `${emoji} Crushed my daily steps goal! Just hit ${value} and feeling unstoppable! 💪

#MovinFitness #StepsGoal #FitnessMotivation #HealthyLifestyle #Achievement`;
      break;

    case 'streak':
      emoji = '🔥📈';
      content = `${emoji} ${value} activity streak! Consistency is key and I'm proving it every single day! 

${description}

#MovinFitness #StreakMilestone #Consistency #FitnessJourney #NeverGiveUp`;
      break;

    case 'workout':
      emoji = '💪🏆';
      content = `${emoji} Just completed an amazing workout session! Feeling energized and accomplished! 

#MovinFitness #WorkoutComplete #FitnessGoals #HealthyLifestyle #TrainingDay`;
      break;

    case 'activity_rewards':
      emoji = '🏃‍♂️💰';
      content = `${emoji} Earned ${rewardAmount} ${rewardCurrency} from my daily activities! Getting fit and earning rewards with @MovinApp! 

Staying active has never been more rewarding! 💎

#MovinFitness #EarnWhileYouBurn #FitnessRewards #Web3Fitness #HealthyLifestyle`;
      break;

    case 'staking_rewards':
      emoji = '💎🔒';
      content = `${emoji} Just claimed ${rewardAmount} ${rewardCurrency} in staking rewards! Smart investing meets fitness goals with @MovinApp! 

Building wealth while building health! 📈💪

#MovinFitness #StakingRewards #Web3Fitness #CryptoFitness #InvestInHealth`;
      break;

    case 'level':
      emoji = '⭐🆙';
      content = `${emoji} Level up! Just reached ${title}! Each workout brings me closer to my ultimate fitness goals! 

${description}

#MovinFitness #LevelUp #FitnessGoals #PersonalGrowth #Achievement`;
      break;

    default:
      emoji = '🎉🏆';
      content = `${emoji} Achievement unlocked: ${title}! 

${description || 'Another milestone reached on my fitness journey!'}

#MovinFitness #Achievement #FitnessGoals #HealthyLifestyle`;
      break;
  }

  return content;
}

/**
 * Create achievement data object from celebration props
 */
export function createAchievementData(
  achievementType: 'steps' | 'workout' | 'streak' | 'level' | 'staking_rewards',
  achievementValue: string,
  achievementTitle: string,
  description?: string,
  rewardAmount?: string,
  rewardCurrency?: string,
  customType?: 'activity_rewards' | 'staking_rewards',
): AchievementData {
  return {
    type: customType || achievementType,
    value: achievementValue,
    title: achievementTitle,
    description,
    rewardAmount,
    rewardCurrency,
  };
}

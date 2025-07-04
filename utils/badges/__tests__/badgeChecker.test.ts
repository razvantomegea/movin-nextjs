import { IActivity } from '@/lib/supabase/activities';
import { IBadge, IUserBadge } from '@/lib/supabase/badges';
import { IProfile } from '@/lib/supabase/profile';
import * as badgeChecker from '../badgeChecker';

describe('badgeChecker', () => {
  const mockActivity: IActivity = {
    id: 'a1',
    address: 'addr1',
    name: 'Run',
    source: 'Manual',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 3600000).toISOString(),
    duration: 3600,
    total_energy_burned: 400,
    total_distance: 5000,
    total_steps: 7000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockProfile: IProfile = {
    id: 'p1',
    username: 'testuser',
    email: 'test@example.com',
    address: 'addr1',
    avatar_url: 'avatar.png',
    level: 1,
    streak_days: 5,
    last_streak_update: new Date().toISOString(),
    is_premium: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockUserBadges: IUserBadge[] = [];

  const baseContext = {
    activities: [mockActivity],
    profile: mockProfile,
    userBadges: mockUserBadges,
  };

  it('calculates total distance', () => {
    expect(badgeChecker.calculateTotalDistance([mockActivity])).toBe(5000);
  });

  it('calculates total steps', () => {
    expect(badgeChecker.calculateTotalSteps([mockActivity])).toBe(7000);
  });

  it('gets steps for a specific day', () => {
    const today = new Date();
    expect(badgeChecker.getStepsForDay([mockActivity], today)).toBe(7000);
  });

  it('counts joint activities', () => {
    const joint: IActivity = { ...mockActivity, name: 'Joint Run', source: 'Joint Tracking' };
    expect(badgeChecker.countJointActivities([joint])).toBe(1);
  });

  it('checks if activity is early morning', () => {
    const early: IActivity = {
      ...mockActivity,
      start_date: new Date(2023, 0, 1, 5, 0, 0).toISOString(),
    };
    expect(badgeChecker.isEarlyMorningActivity(early)).toBe(true);
  });

  it('checks if activity is late night', () => {
    const late: IActivity = {
      ...mockActivity,
      start_date: new Date(2023, 0, 1, 22, 0, 0).toISOString(),
    };
    expect(badgeChecker.isLateNightActivity(late)).toBe(true);
  });

  it('checks if profile is complete', () => {
    expect(badgeChecker.isProfileComplete(mockProfile)).toBe(true);
  });

  it('checks distance badge eligibility', () => {
    const badge: IBadge = {
      id: 'b1',
      name: 'Distance Badge',
      description: '',
      icon: '',
      color: '',
      category: 'distance',
      requirement_type: 'total',
      requirement_value: 1000,
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = badgeChecker.checkBadgeEligibility(badge, baseContext);
    expect(result.earned).toBe(true);
  });

  it('checks step badge eligibility', () => {
    const badge: IBadge = {
      id: 'b2',
      name: 'Step Badge',
      description: '',
      icon: '',
      color: '',
      category: 'steps',
      requirement_type: 'total',
      requirement_value: 5000,
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = badgeChecker.checkBadgeEligibility(badge, baseContext);
    expect(result.earned).toBe(true);
  });

  it('checks streak badge eligibility', () => {
    const badge: IBadge = {
      id: 'b3',
      name: 'Streak Badge',
      description: '',
      icon: '',
      color: '',
      category: 'streak',
      requirement_type: 'total',
      requirement_value: 3,
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = badgeChecker.checkBadgeEligibility(badge, baseContext);
    expect(result.earned).toBe(true);
  });

  it('checks time badge eligibility (Early Bird)', () => {
    const badge: IBadge = {
      id: 'b4',
      name: 'Early Bird',
      description: '',
      icon: '',
      color: '',
      category: 'time',
      requirement_type: 'single_activity',
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const context = {
      ...baseContext,
      newActivity: { ...mockActivity, start_date: new Date(2023, 0, 1, 5, 0, 0).toISOString() },
    };
    const result = badgeChecker.checkBadgeEligibility(badge, context);
    expect(result.earned).toBe(true);
  });

  it('checks calorie badge eligibility', () => {
    const badge: IBadge = {
      id: 'b5',
      name: 'Calorie Badge',
      description: '',
      icon: '',
      color: '',
      category: 'calories',
      requirement_type: 'total',
      requirement_value: 100,
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = badgeChecker.checkBadgeEligibility(badge, baseContext);
    expect(result.earned).toBe(true);
  });

  it('checks social badge eligibility (Team Player)', () => {
    const badge: IBadge = {
      id: 'b6',
      name: 'Team Player',
      description: '',
      icon: '',
      color: '',
      category: 'social',
      requirement_type: 'total',
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const joint: IActivity = { ...mockActivity, name: 'Joint Run', source: 'Joint Tracking' };
    const context = { ...baseContext, activities: [joint] };
    const result = badgeChecker.checkBadgeEligibility(badge, context);
    expect(result.earned).toBe(true);
  });

  it('checks special badge eligibility (Profile Pro)', () => {
    const badge: IBadge = {
      id: 'b7',
      name: 'Profile Pro',
      description: '',
      icon: '',
      color: '',
      category: 'special',
      requirement_type: 'condition',
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = badgeChecker.checkBadgeEligibility(badge, baseContext);
    expect(result.earned).toBe(true);
  });

  it('returns false if user already has badge', () => {
    const badge: IBadge = {
      id: 'b8',
      name: 'Distance Badge',
      description: '',
      icon: '',
      color: '',
      category: 'distance',
      requirement_type: 'total',
      requirement_value: 1000,
      rarity: 'common',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const userBadge: IUserBadge = {
      id: 'ub1',
      address: 'addr1',
      badge_id: 'b8',
      earned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    const context = { ...baseContext, userBadges: [userBadge] };
    const result = badgeChecker.checkBadgeEligibility(badge, context);
    expect(result.earned).toBe(false);
  });

  it('checks multiple badges at once', () => {
    const badges: IBadge[] = [
      {
        id: 'b1',
        name: 'Distance Badge',
        description: '',
        icon: '',
        color: '',
        category: 'distance',
        requirement_type: 'total',
        requirement_value: 1000,
        rarity: 'common',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'b2',
        name: 'Step Badge',
        description: '',
        icon: '',
        color: '',
        category: 'steps',
        requirement_type: 'total',
        requirement_value: 5000,
        rarity: 'common',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    const results = badgeChecker.checkMultipleBadges(badges, baseContext);
    expect(results.length).toBe(2);
    expect(results[0].earned).toBe(true);
    expect(results[1].earned).toBe(true);
  });
});

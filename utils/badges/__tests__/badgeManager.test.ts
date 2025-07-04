import { IActivity } from '@/lib/supabase/activities';
import { IBadge, IUserBadge } from '@/lib/supabase/badges';
import { IProfile } from '@/lib/supabase/profile';
import { BadgeManager, createBadgeManager, checkNewActivityBadges } from '../badgeManager';

const badge1: IBadge = {
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
const badge2: IBadge = {
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

jest.mock('@/lib/supabase/badges', () => ({
  getAllBadges: jest.fn(() => Promise.resolve([badge1, badge2])),
  getUserBadges: jest.fn(() => Promise.resolve([])),
  awardBadge: jest.fn(({ badgeId }) => Promise.resolve({ badge_id: badgeId })),
}));

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

describe('BadgeManager', () => {
  it('initializes and fetches badges and user badges', async () => {
    const manager = new BadgeManager('address1');
    await manager.initialize();
    expect(manager.getAllBadges().length).toBeGreaterThan(0);
    expect(manager.getUserBadges().length).toBe(0);
  });

  it('checkAndAwardBadges awards new badges', async () => {
    const manager = new BadgeManager('address2');
    await manager.initialize();
    const result = await manager.checkAndAwardBadges({
      activities: [mockActivity],
      profile: mockProfile,
    });
    expect(result.newBadges.length).toBeGreaterThan(0);
    expect(result.errors.length).toBe(0);
    expect(Object.keys(result.progress).length).toBeGreaterThan(0);
  });

  it('checkNewActivityBadges works and returns new badges', async () => {
    const manager = new BadgeManager('address3');
    await manager.initialize();
    const result = await manager.checkNewActivityBadges(mockActivity, [mockActivity], mockProfile);
    expect(result.newBadges.length).toBeGreaterThan(0);
  });

  it('getBadgeProgress returns progress for badges', async () => {
    const manager = new BadgeManager('address4');
    await manager.initialize();
    const progress = manager.getBadgeProgress(undefined, [mockActivity], mockProfile);
    expect(Object.keys(progress).length).toBeGreaterThan(0);
  });

  it('getStats returns badge stats', async () => {
    const manager = new BadgeManager('address5');
    await manager.initialize();
    // Simulate earning a badge
    (manager as unknown as { userBadges: IUserBadge[] }).userBadges = [
      {
        id: 'ub1',
        address: 'addr1',
        badge_id: 'b1',
        earned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        badge: { ...badge1, rarity: 'common', category: 'distance' },
      },
    ];
    const stats = manager.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byRarity.common).toBe(1);
    expect(stats.byCategory.distance).toBe(1);
  });

  it('hasBadge returns true if user has badge', async () => {
    const manager = new BadgeManager('address6');
    await manager.initialize();
    (manager as unknown as { userBadges: IUserBadge[] }).userBadges = [
      {
        id: 'ub2',
        address: 'addr1',
        badge_id: 'b1',
        earned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
    expect(manager.hasBadge('b1')).toBe(true);
    expect(manager.hasBadge('b2')).toBe(false);
  });

  it('refresh resets and re-initializes', async () => {
    const manager = new BadgeManager('address7');
    await manager.initialize();
    await manager.refresh();
    expect(manager.getAllBadges().length).toBeGreaterThan(0);
  });
});

describe('createBadgeManager', () => {
  it('creates and initializes a BadgeManager', async () => {
    const manager = await createBadgeManager('address8');
    expect(manager).toBeInstanceOf(BadgeManager);
    expect(manager.getAllBadges().length).toBeGreaterThan(0);
  });
});

describe('checkNewActivityBadges (utility)', () => {
  it('checks and awards badges for a new activity', async () => {
    const result = await checkNewActivityBadges(
      'address9',
      mockActivity,
      [mockActivity],
      mockProfile,
    );
    expect(result.newBadges.length).toBeGreaterThan(0);
  });
});

# Level Progression System Implementation

## 🎯 Overview

I've implemented a comprehensive level progression system that automatically increases user profile levels when they complete their daily, weekly, or monthly goals. The system provides both SQL-based triggers for automatic updates and centralized TypeScript utilities for manual control.

## 📋 What Was Implemented

### 1. SQL Functions & Triggers (`lib/supabase/sql/create-level-system.sql`)

- **`check_goals_completed(user_address, category)`**: Checks if all goals in a category are completed
- **`update_profile_level(user_address)`**: Updates profile level based on completed goals  
- **`trigger_level_check(user_address)`**: Manually triggers level checking
- **`get_level_progression_info(user_address)`**: Gets level info without updating
- **`reset_goal_progress(user_address, category)`**: Resets goal progress for testing
- **Automatic trigger**: Fires when goals transition from incomplete to complete

### 2. TypeScript Utilities (`lib/supabase/levelProgression.ts`)

- **`checkAndUpdateLevel()`**: Main function to check and update levels
- **`getLevelProgressionInfo()`**: Get progression info without updating
- **`canUserLevelUp()`**: Check if user can level up
- **`updateGoalProgressAndCheckLevel()`**: Update goals and check levels simultaneously
- **`getUserCurrentLevel()`**: Get current level efficiently
- **`resetGoalProgress()`**: Reset progress for testing

### 3. React Hooks (`lib/hooks/useLevelProgression.ts`)

- **`useLevelProgression`**: Full-featured hook with state management
- **`useSimpleLevelCheck`**: Simple hook for basic level checking

### 4. Enhanced Goal System

- Updated `updateGoalProgress()` with optional `checkLevelProgression` parameter
- Updated `updateAllGoalProgress()` to automatically check levels
- Integrated level checking into existing goal update workflows

### 5. Setup & Testing Scripts

- **`scripts/setup-level-progression.sql`**: Complete setup and testing script
- **Documentation**: Comprehensive usage guide in `docs/level-progression-system.md`

## 🎮 Level Increase Rules

| Goal Category | Level Increase | Description |
|--------------|----------------|-------------|
| **Daily** | +1 level | Complete all daily goals |
| **Weekly** | +2 levels | Complete all weekly goals |
| **Monthly** | +5 levels | Complete all monthly goals |
| **Combined** | Up to +8 levels | Multiple categories can be completed simultaneously |

**Important**: Level checks are limited to once per day per user to prevent abuse.

## 🚀 Quick Start

### 1. Apply SQL Migration

```bash
# Navigate to your database
psql -d your_database_name

# Run the setup script
\i scripts/setup-level-progression.sql
```

### 2. Use in Your Components

#### Basic Level Check
```typescript
import { checkAndUpdateLevel } from '@/lib/supabase/levelProgression';

const result = await checkAndUpdateLevel({ address: userAddress });
if (result.levelIncreased) {
  console.log(`🎉 Level up! Now level ${result.newLevel}!`);
}
```

#### With React Hook
```typescript
import { useLevelProgression } from '@/lib/hooks/useLevelProgression';

function MyComponent() {
  const { checkLevel, lastResult, isLoading } = useLevelProgression({ 
    address: userAddress 
  });

  const handleLevelCheck = async () => {
    const result = await checkLevel();
    if (result.levelIncreased) {
      // Show celebration UI
    }
  };

  return (
    <div>
      {lastResult?.levelIncreased && (
        <div>🎉 Level up! Now level {lastResult.newLevel}!</div>
      )}
      <button onClick={handleLevelCheck} disabled={isLoading}>
        Check Level
      </button>
    </div>
  );
}
```

#### Update Goals with Level Check
```typescript
import { updateGoalProgress } from '@/lib/supabase/goals';

// Automatically check levels after updating goals
await updateGoalProgress({
  address: userAddress,
  category: 'daily',
  checkLevelProgression: true
});
```

### 3. Add Level Up Celebrations

```typescript
// In your goal update components
if (result.levelResult?.levelIncreased) {
  // Show celebration modal/animation
  showLevelUpCelebration({
    oldLevel: result.levelResult.oldLevel,
    newLevel: result.levelResult.newLevel,
    categoriesCompleted: result.levelResult.categoriesCompleted
  });
}
```

## 🔧 Integration Points

### Automatic Triggers (SQL)

The system automatically checks levels when:
- Goal `current_value` is updated
- A goal transitions from incomplete to complete (`current_value >= target_value`)

### Manual Triggers (TypeScript)

You can manually trigger level checks in:
- Dashboard components when user visits
- After logging activities/meals
- After updating goal progress
- In goal management components

### Example Integration Points

1. **Dashboard Load**: Check levels when user visits dashboard
2. **Activity Logging**: Check levels after logging workout/activity
3. **Meal Logging**: Check levels after logging meals
4. **Goal Updates**: Check levels after manually updating goals
5. **Admin Actions**: Manually trigger level checks for users

## 🧪 Testing

### Run Tests with Setup Script

```sql
-- The setup script includes comprehensive tests
\i scripts/setup-level-progression.sql
```

### Manual Testing

```typescript
// Test daily goal completion
await updateGoalProgressAndCheckLevel({
  address: 'test_user',
  category: 'daily'
});

// Test level info
const info = await getLevelProgressionInfo({ address: 'test_user' });
console.log(info);

// Reset for retesting  
await resetGoalProgress({ address: 'test_user', category: 'daily' });
```

### SQL Testing Functions

```sql
-- Simulate completing goals
SELECT * FROM simulate_goal_completion('user_address', 'daily');

-- Check level progression info
SELECT * FROM get_level_progression_info('user_address');

-- Reset goals for testing
SELECT reset_goal_progress('user_address', 'daily');
```

## 🛡️ Error Handling & Safety

### Built-in Safeguards

- **Daily Limit**: Level checks limited to once per day per user
- **Goal Validation**: Only completed goals (`current_value >= target_value`) count
- **Error Isolation**: Level check failures don't break goal updates
- **Graceful Degradation**: System continues working if level check fails

### Error Handling Examples

```typescript
// Level checks won't break goal updates
try {
  await updateGoalProgress({ address, category: 'daily', checkLevelProgression: true });
} catch (error) {
  // Goal update succeeded, level check may have failed
  console.warn('Level check failed:', error);
}

// Handle level check errors gracefully
const { error, clearError } = useLevelProgression({ address });
if (error) {
  // Show error message but don't block UI
  console.error('Level progression error:', error);
  clearError(); // Clear error state
}
```

## 📊 Performance Features

- **Efficient Triggers**: Only fire when goals transition to complete
- **Daily Limits**: Prevent excessive level checks
- **Async Operations**: Level checks don't block goal updates
- **Minimal Queries**: Optimized SQL for fast execution

## 🔍 Debugging & Monitoring

### SQL Debug Commands

```sql
-- Check user's goals status
SELECT * FROM goals WHERE address = 'user_address' AND is_active = true;

-- Check level progression info
SELECT * FROM get_level_progression_info('user_address');

-- View profile level history
SELECT address, level, updated_at FROM profiles WHERE address = 'user_address';
```

### TypeScript Debug

```typescript
// Check what categories are completed
const { completedCategories, potentialIncrease } = await canUserLevelUp({ address });
console.log('Completed:', completedCategories, 'Potential increase:', potentialIncrease);

// Get detailed level info
const info = await getLevelProgressionInfo({ address });
console.log('Level info:', info);
```

## 📈 Future Enhancements

Potential improvements you could add:

1. **Level Logs Table**: Track level increase history
2. **Badges/Achievements**: Award special items for level milestones
3. **Experience Points**: More granular progression system
4. **Streak Bonuses**: Extra levels for consecutive goal completions
5. **Social Features**: Share level ups, leaderboards
6. **Custom Rewards**: Unlock features/content at certain levels

## 🎉 Conclusion

The level progression system is now fully implemented and ready to use! It provides:

✅ **Automatic level increases** when users complete goals  
✅ **SQL triggers** for real-time updates  
✅ **TypeScript utilities** for centralized control  
✅ **React hooks** for easy component integration  
✅ **Comprehensive error handling** and safety features  
✅ **Testing tools** and documentation  
✅ **Performance optimization** with daily limits  

Users will now automatically level up when they:
- Complete all daily goals (+1 level)
- Complete all weekly goals (+2 levels)  
- Complete all monthly goals (+5 levels)
- Complete multiple categories simultaneously (cumulative increases)

The system is production-ready and can be deployed immediately!
# Level Progression System

This document explains how to use the level progression system that automatically increases user profile levels when they complete their daily, weekly, or monthly goals.

## Overview

The level progression system consists of:
- **SQL Functions & Triggers**: Automatically check and update levels when goals are completed
- **TypeScript Utilities**: Centralized functions for manual level checks and updates
- **React Hooks**: Easy-to-use hooks for components to manage level progression

## Level Increase Rules

- **Daily Goals Completed**: +1 level
- **Weekly Goals Completed**: +2 levels  
- **Monthly Goals Completed**: +5 levels
- **Multiple Categories**: Can be completed simultaneously for cumulative increases (max +8 per day)
- **Frequency Limit**: Level checks happen once per day maximum to prevent abuse

## Automatic Level Updates (SQL Triggers)

The system automatically checks for level increases whenever:
1. Goal progress is updated (`current_value` changes)
2. A goal transitions from incomplete to complete (`current_value >= target_value`)

### SQL Functions Available

```sql
-- Check if all goals in a category are completed
SELECT check_goals_completed('user_address', 'daily');

-- Update user's profile level based on completed goals
SELECT * FROM update_profile_level('user_address');

-- Manually trigger level check
SELECT * FROM trigger_level_check('user_address');

-- Get level progression info without updating
SELECT * FROM get_level_progression_info('user_address');

-- Reset goal progress for a category
SELECT reset_goal_progress('user_address', 'daily');
```

## TypeScript Utilities

### Import the Level Progression Module

```typescript
import {
  checkAndUpdateLevel,
  getLevelProgressionInfo,
  canUserLevelUp,
  updateGoalProgressAndCheckLevel,
  triggerLevelCheck,
  getUserCurrentLevel,
  resetGoalProgress,
  LevelProgressionResult,
  LevelProgressionInfo
} from '@/lib/supabase/levelProgression';
```

### Basic Usage Examples

#### Check and Update Level

```typescript
// Basic level check
const result = await checkAndUpdateLevel({ address: userAddress });

if (result.levelIncreased) {
  console.log(`User leveled up from ${result.oldLevel} to ${result.newLevel}!`);
  console.log(`Completed categories: ${result.categoriesCompleted.join(', ')}`);
}
```

#### Get Level Progression Info

```typescript
// Check what goals are completed without updating level
const info = await getLevelProgressionInfo({ address: userAddress });

console.log(`Current level: ${info.currentLevel}`);
console.log(`Daily goals completed: ${info.dailyGoalsCompleted}`);
console.log(`Potential level increase: ${info.potentialLevelIncrease}`);
```

#### Check if User Can Level Up

```typescript
const { canLevelUp, completedCategories, potentialIncrease } = 
  await canUserLevelUp({ address: userAddress });

if (canLevelUp) {
  console.log(`User can gain ${potentialIncrease} levels!`);
}
```

#### Update Goals and Check Level Simultaneously

```typescript
// Update daily goals and check for level progression
const result = await updateGoalProgressAndCheckLevel({
  address: userAddress,
  category: 'daily'
});

if (result.levelResult?.levelIncreased) {
  // Handle level up celebration!
}
```

## React Hooks Usage

### useLevelProgression Hook

For components that need full level progression management:

```typescript
import { useLevelProgression } from '@/lib/hooks/useLevelProgression';

function MyComponent() {
  const { 
    isLoading, 
    error, 
    lastResult, 
    checkLevel, 
    getLevelInfo,
    canLevelUp,
    updateProgressAndCheck,
    clearError 
  } = useLevelProgression({ 
    address: userAddress,
    client: supabaseClient 
  });

  const handleLevelCheck = async () => {
    try {
      const result = await checkLevel();
      if (result.levelIncreased) {
        // Show level up animation/celebration
        showLevelUpCelebration(result);
      }
    } catch (error) {
      console.error('Level check failed:', error);
    }
  };

  const handleGoalUpdate = async () => {
    try {
      const result = await updateProgressAndCheck('daily');
      if (result.levelResult?.levelIncreased) {
        // Handle level up
      }
    } catch (error) {
      console.error('Goal update failed:', error);
    }
  };

  return (
    <div>
      {isLoading && <div>Checking level...</div>}
      {error && <div>Error: {error}</div>}
      {lastResult?.levelIncreased && (
        <div>🎉 Level up! Now level {lastResult.newLevel}!</div>
      )}
      
      <button onClick={handleLevelCheck}>Check Level</button>
      <button onClick={handleGoalUpdate}>Update Goals & Check Level</button>
    </div>
  );
}
```

### useSimpleLevelCheck Hook

For simple level checking without state management:

```typescript
import { useSimpleLevelCheck } from '@/lib/hooks/useLevelProgression';

function SimpleComponent() {
  const checkLevel = useSimpleLevelCheck(userAddress, supabaseClient);

  const handleCheck = async () => {
    const result = await checkLevel();
    if (result.levelIncreased) {
      // Handle level up
    }
  };

  return <button onClick={handleCheck}>Quick Level Check</button>;
}
```

## Integration Examples

### In Goal Update Components

```typescript
// After updating a goal's progress
import { updateGoalProgress } from '@/lib/supabase/goals';

async function updateUserGoal() {
  // Update goal progress with level checking enabled
  await updateGoalProgress({
    address: userAddress,
    category: 'daily',
    checkLevelProgression: true  // This will automatically check levels
  });
}
```

### In Dashboard Components

```typescript
// Check level progression when user views dashboard
import { checkAndUpdateLevel } from '@/lib/supabase/levelProgression';

useEffect(() => {
  if (userAddress) {
    checkAndUpdateLevel({ address: userAddress })
      .then((result) => {
        if (result.levelIncreased) {
          // Show celebration modal/animation
          setShowLevelUpModal(true);
        }
      })
      .catch(console.error);
  }
}, [userAddress]);
```

### In Activity/Meal Logging Components

```typescript
// After logging an activity or meal
import { updateGoalProgressAndCheckLevel } from '@/lib/supabase/levelProgression';

async function onActivityLogged() {
  // Update all goal categories and check for level up
  const result = await updateGoalProgressAndCheckLevel({
    address: userAddress,
    category: 'daily'  // or determine category based on activity
  });

  if (result.levelResult?.levelIncreased) {
    // Trigger celebration UI
    triggerLevelUpCelebration(result.levelResult);
  }
}
```

## Setup Instructions

### 1. Run SQL Migration

Execute the level progression SQL file:

```bash
# Apply the level progression system
psql -d your_database -f lib/supabase/sql/create-level-system.sql
```

### 2. Update Existing Goal Updates

Modify existing goal update calls to include level checking:

```typescript
// Before
await updateGoalProgress({ address, category: 'daily' });

// After  
await updateGoalProgress({ 
  address, 
  category: 'daily',
  checkLevelProgression: true 
});
```

### 3. Add Level Up Celebrations

Create UI components to celebrate level increases:

```typescript
function LevelUpModal({ result }: { result: LevelProgressionResult }) {
  return (
    <Modal show={result.levelIncreased}>
      <div className="text-center">
        <h2>🎉 Level Up!</h2>
        <p>You've reached Level {result.newLevel}!</p>
        <p>Completed: {result.categoriesCompleted.join(', ')} goals</p>
      </div>
    </Modal>
  );
}
```

## Testing

### Test Level Progression

```typescript
// Test daily goal completion
await updateGoalProgressAndCheckLevel({
  address: 'test_user',
  category: 'daily'
});

// Test multiple category completion
const result = await checkAndUpdateLevel({ address: 'test_user' });
console.log('Level increase:', result.levelIncrease);
```

### Reset for Testing

```typescript
// Reset daily progress for testing
await resetGoalProgress({
  address: 'test_user',
  category: 'daily'
});
```

## Error Handling

The level progression system includes comprehensive error handling:

- **SQL triggers**: Continue goal updates even if level check fails
- **TypeScript functions**: Throw descriptive errors for debugging
- **React hooks**: Provide error state management

```typescript
// Handle errors gracefully
try {
  const result = await checkAndUpdateLevel({ address });
} catch (error) {
  console.error('Level check failed:', error);
  // Continue with app functionality
}
```

## Performance Considerations

- **Daily limit**: Level checks are limited to once per day per user
- **Trigger efficiency**: SQL triggers only fire when goals transition to complete
- **Async operations**: Level checks don't block goal updates
- **Caching**: Consider caching level info for UI display

## Troubleshooting

### Common Issues

1. **Level not updating**: Check if goals are actually completed (`current_value >= target_value`)
2. **Multiple updates**: Level checks are limited to once per day
3. **Missing triggers**: Ensure SQL migration was applied
4. **Import errors**: Check that all TypeScript files are in correct locations

### Debug Commands

```sql
-- Check user's current goals status
SELECT * FROM goals WHERE address = 'user_address' AND is_active = true;

-- Check level progression info
SELECT * FROM get_level_progression_info('user_address');

-- Manually trigger level check
SELECT * FROM trigger_level_check('user_address');
```
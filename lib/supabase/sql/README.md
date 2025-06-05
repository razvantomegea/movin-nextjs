# User Data Deletion SQL Functions

This directory contains SQL functions for safely deleting all user data from the Movin application database.

## Files

### `delete-user-data.sql`

Contains two main PostgreSQL functions for handling user data deletion:

#### `delete_all_user_data(user_address TEXT)`

- **Purpose**: Permanently deletes all data associated with a user's wallet address
- **Security**: Uses `SECURITY DEFINER` with authentication checks to ensure users can only delete their own data
- **Tables affected**:
  - `activities` - User workout activities
  - `activity_rewards` - Earned rewards from activities
  - `user_badges` - User's earned badges (links to badges table)
  - `staking` - Staking records and positions
  - `profiles` - User profile information
- **Note**: The `badges` table is NOT affected as it contains the master list of available badges, not user-specific data
- **Returns**: JSON object with success status and deletion counts
- **Error handling**: Catches and returns database errors safely

#### `get_user_data_summary(user_address TEXT)`

- **Purpose**: Provides a summary of all user data before deletion
- **Returns**: JSON object with:
  - Data counts for each table
  - Total rewards earned
  - Total tokens staked
  - User existence status
- **Use case**: Shows users what data will be deleted before confirmation

## Usage

These functions are called through the TypeScript wrapper functions in `lib/supabase/deleteUserData.ts`:

```typescript
// Get data summary
const summary = await getUserDataSummary({ address: userAddress });

// Delete all data
const result = await deleteAllUserData({ address: userAddress });
```

## Security Features

1. **Authentication Required**: Functions check JWT token to verify user identity
2. **Authorization**: Users can only delete their own data (address matching)
3. **Row Level Security**: All affected tables have RLS policies enabled
4. **Transaction Safety**: Operations are wrapped in transactions for consistency
5. **Error Handling**: Safe error messages without exposing internal details

## Data Flow

1. User initiates deletion from the settings page
2. Frontend shows data summary using `get_user_data_summary()`
3. User confirms through multi-step process
4. Frontend calls `delete_all_user_data()`
5. Function deletes data in correct order to maintain referential integrity
6. Returns summary of what was deleted

## Database Tables

The system manages data across these tables:

- **`activities`** - User workout activities (has `address` field)
- **`activity_rewards`** - Reward claims by users (has `address` field)
- **`badges`** - Master list of available badges (NO user data, not deleted)
- **`profiles`** - User profiles (has `address` field)
- **`staking`** - User staking records (has `address` field)
- **`user_badges`** - User's earned badges (has `address` field, links to badges)

## Database Constraints

The deletion respects foreign key constraints and follows this order:

1. Activities (user-specific workout data)
2. Activity rewards (user reward claims)
3. User badges (user's earned badges, not the master badges list)
4. Staking records (user staking positions)
5. Profile (main user record)

This ensures no orphaned records remain in the database while preserving the master `badges` table.

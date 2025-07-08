import * as Sentry from '@sentry/nextjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export interface UserDataSummary {
  exists: boolean;
  summary: {
    activities: number;
    activity_rewards: number;
    user_badges: number;
    staking: number;
    meals: number;
    energy: number;
    goals: number;
    social_posts: number;
    connections: number;
    post_likes: number;
    post_comments: number;
    workouts: number;
    workout_exercises: number;
    exercise_sets: number;
    total_rewards: number;
    total_staked: number;
    // Profile fields
    email?: string;
    level?: number;
    streak_days?: number;
    last_streak_update?: string;
    is_premium?: boolean;
    weight?: number;
    weight_unit?: string;
    weight_updated_at?: string;
    height?: number;
    date_of_birth?: string;
    biological_sex?: string;
    bio?: string;
    website?: string;
    created_at?: string;
    updated_at?: string;
    avatar_url?: string;
    username?: string;
  };
}

export interface DeleteResult {
  success: boolean;
  message?: string;
  error?: string;
  deleted_counts: {
    activities: number;
    activity_rewards: number;
    user_badges: number;
    staking: number;
    meals: number;
    energy: number;
    goals: number;
    social_posts: number;
    connections: number;
    post_likes: number;
    post_comments: number;
    workouts: number;
    workout_exercises: number;
    exercise_sets: number;
    profile: number;
  };
}

/**
 * Get a summary of all user data before deletion
 */
export async function getUserDataSummary({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<UserDataSummary> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Invalid address provided');
  }

  if (!client) {
    client = getClient();
  }

  try {
    // Try using the SQL function first
    const { data, error } = await client.rpc('get_user_data_summary', {
      user_address: address,
    });

    if (error) {
      throw error;
    }

    return data as UserDataSummary;
  } catch (error) {
    // Fallback to direct queries if function doesn't exist
    console.warn('SQL function not found, using fallback queries:', error);
    Sentry.captureException(error);

    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('*')
        .eq('address', address)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profile) {
        return {
          exists: false,
          summary: {
            activities: 0,
            activity_rewards: 0,
            user_badges: 0,
            staking: 0,
            meals: 0,
            energy: 0,
            goals: 0,
            social_posts: 0,
            connections: 0,
            post_likes: 0,
            post_comments: 0,
            workouts: 0,
            workout_exercises: 0,
            exercise_sets: 0,
            total_rewards: 0,
            total_staked: 0,
          },
        };
      }

      // Get counts for each table
      const [
        activitiesRes,
        rewardsRes,
        badgesRes,
        stakingRes,
        mealsRes,
        energyRes,
        goalsRes,
        socialPostsRes,
        connectionsRequesterRes,
        connectionsAddresseeRes,
        postLikesRes,
        postCommentsRes,
        workoutsRes,
        workoutExercisesRes,
        exerciseSetsRes,
      ] = await Promise.all([
        client
          .from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
        client
          .from('activity_rewards')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
        client
          .from('user_badges')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
        client.from('staking').select('id', { count: 'exact', head: true }).eq('address', address),
        client.from('meals').select('id', { count: 'exact', head: true }).eq('address', address),
        client.from('energy').select('id', { count: 'exact', head: true }).eq('address', address),
        client.from('goals').select('id', { count: 'exact', head: true }).eq('address', address),
        client
          .from('social_posts')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
        client
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('requester_address', address),
        client
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('addressee_address', address),
        client
          .from('post_likes')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
        client
          .from('post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
        client.from('workouts').select('id', { count: 'exact', head: true }).eq('address', address),
        client
          .from('workout_exercises')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
        client
          .from('exercise_sets')
          .select('id', { count: 'exact', head: true })
          .eq('address', address),
      ]);

      // Get reward totals
      const { data: rewardData } = await client
        .from('activity_rewards')
        .select('rewards')
        .eq('address', address);

      const { data: stakingData } = await client
        .from('staking')
        .select('amount')
        .eq('address', address)
        .eq('is_active', true);

      const totalRewards = rewardData?.reduce((sum, r) => sum + Number(r.rewards || 0), 0) || 0;
      const totalStaked = stakingData?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;

      // Calculate total connections (both as requester and addressee)
      const totalConnections =
        (connectionsRequesterRes.count || 0) + (connectionsAddresseeRes.count || 0);

      return {
        exists: true,
        summary: {
          activities: activitiesRes.count || 0,
          activity_rewards: rewardsRes.count || 0,
          user_badges: badgesRes.count || 0,
          staking: stakingRes.count || 0,
          meals: mealsRes.count || 0,
          energy: energyRes.count || 0,
          goals: goalsRes.count || 0,
          social_posts: socialPostsRes.count || 0,
          connections: totalConnections,
          post_likes: postLikesRes.count || 0,
          post_comments: postCommentsRes.count || 0,
          workouts: workoutsRes.count || 0,
          workout_exercises: workoutExercisesRes.count || 0,
          exercise_sets: exerciseSetsRes.count || 0,
          total_rewards: totalRewards,
          total_staked: totalStaked,
          // Profile fields
          email: profile.email,
          level: profile.level,
          streak_days: profile.streak_days,
          last_streak_update: profile.last_streak_update,
          is_premium: profile.is_premium,
          weight: profile.weight,
          weight_unit: profile.weight_unit,
          weight_updated_at: profile.weight_updated_at,
          height: profile.height,
          date_of_birth: profile.date_of_birth,
          biological_sex: profile.biological_sex,
          bio: profile.bio,
          website: profile.website,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          avatar_url: profile.avatar_url,
          username: profile.username,
        },
      };
    } catch (fallbackError) {
      Sentry.captureException(fallbackError);
      throw new Error(
        `Failed to get user data summary: ${
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        }`,
      );
    }
  }
}

/**
 * Delete an avatar from storage
 * @param avatarUrl - The public URL of the avatar
 * @param client - Supabase client
 */
export async function deleteAvatar({
  avatarUrl,
  client,
}: {
  avatarUrl: string;
  client?: SupabaseClient;
}) {
  if (!client) {
    client = getClient();
  }
  try {
    const filePath = new URL(avatarUrl).pathname.split('/avatars/')[1];
    if (filePath) {
      const { error } = await client.storage.from('avatars').remove([filePath]);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Failed to delete avatar:', error);
    Sentry.captureException(error);
    // We don't rethrow, as we want to proceed with deleting the rest of the data
  }
}

/**
 * Delete all user data from the database
 * This will permanently remove all data associated with the user's address
 */
export async function deleteAllUserData({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<DeleteResult> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Invalid address provided');
  }

  if (!client) {
    client = getClient();
  }

  try {
    // First, fetch the profile to get the avatar URL for deletion
    const { data: profile } = await client
      .from('profiles')
      .select('avatar_url')
      .eq('address', address)
      .single();

    if (profile?.avatar_url) {
      await deleteAvatar({ avatarUrl: profile.avatar_url, client });
    }

    // Try using the SQL function first
    const { data, error } = await client.rpc('delete_all_user_data', {
      user_address: address,
    });

    if (error) {
      throw error;
    }

    return data as DeleteResult;
  } catch (error) {
    // Fallback to direct deletion if function doesn't exist
    console.warn('SQL function not found, using fallback deletion:', error);

    try {
      // First get counts before deletion
      const summary = await getUserDataSummary({ address, client });

      if (!summary.exists) {
        return {
          success: false,
          error: 'User profile not found',
          deleted_counts: {
            activities: 0,
            activity_rewards: 0,
            user_badges: 0,
            staking: 0,
            meals: 0,
            energy: 0,
            goals: 0,
            social_posts: 0,
            connections: 0,
            post_likes: 0,
            post_comments: 0,
            workouts: 0,
            workout_exercises: 0,
            exercise_sets: 0,
            profile: 0,
          },
        };
      }

      // Use a database function that wraps deletion in a transaction if available
      try {
        // Try to use a custom function that handles the transaction internally
        const { error: txError } = await client.rpc('delete_user_data_with_transaction', {
          user_address: address,
        });

        if (txError) {
          throw txError;
        }
      } catch (txFunctionError) {
        // If the transaction function is not available, execute individual queries
        console.warn(
          'Transaction function not available, using raw SQL transaction:',
          txFunctionError,
        );

        // Execute raw SQL to perform transaction
        const { error: sqlError } = await client.rpc('execute_transaction', {
          sql_commands: `
            BEGIN;
            DELETE FROM post_likes WHERE address = '${address}';
            DELETE FROM post_comments WHERE address = '${address}';
            DELETE FROM social_posts WHERE address = '${address}';
            DELETE FROM connections WHERE requester_address = '${address}' OR addressee_address = '${address}';
            DELETE FROM workout_exercises WHERE address = '${address}';
            DELETE FROM workouts WHERE address = '${address}';
            DELETE FROM goals WHERE address = '${address}';
            DELETE FROM activities WHERE address = '${address}';
            DELETE FROM activity_rewards WHERE address = '${address}';
            DELETE FROM user_badges WHERE address = '${address}';
            DELETE FROM staking WHERE address = '${address}';
            DELETE FROM meals WHERE address = '${address}';
            DELETE FROM energy WHERE address = '${address}';
            DELETE FROM exercise_sets WHERE address = '${address}';
            DELETE FROM profiles WHERE address = '${address}';
            COMMIT;
          `,
        });

        if (sqlError) {
          // If raw SQL transaction fails too, fall back to sequential operations
          console.warn('SQL transaction failed, falling back to sequential operations:', sqlError);

          // Delete data in correct order (respecting foreign keys)
          await client.from('post_likes').delete().eq('address', address);
          await client.from('post_comments').delete().eq('address', address);
          await client.from('social_posts').delete().eq('address', address);
          // For connections, delete both where user is requester or addressee
          await client
            .from('connections')
            .delete()
            .or(`requester_address.eq.${address},addressee_address.eq.${address}`);
          await client.from('workout_exercises').delete().eq('address', address);
          await client.from('workouts').delete().eq('address', address);
          await client.from('goals').delete().eq('address', address);
          await client.from('activities').delete().eq('address', address);
          await client.from('activity_rewards').delete().eq('address', address);
          await client.from('user_badges').delete().eq('address', address);
          await client.from('staking').delete().eq('address', address);
          await client.from('meals').delete().eq('address', address);
          await client.from('energy').delete().eq('address', address);
          await client.from('exercise_sets').delete().eq('address', address);
          await client.from('profiles').delete().eq('address', address);
        }
      }

      return {
        success: true,
        message: 'All user data successfully deleted',
        deleted_counts: {
          activities: summary.summary.activities,
          activity_rewards: summary.summary.activity_rewards,
          user_badges: summary.summary.user_badges,
          staking: summary.summary.staking,
          meals: summary.summary.meals,
          energy: summary.summary.energy,
          goals: summary.summary.goals,
          social_posts: summary.summary.social_posts,
          connections: summary.summary.connections,
          post_likes: summary.summary.post_likes,
          post_comments: summary.summary.post_comments,
          workouts: summary.summary.workouts,
          workout_exercises: summary.summary.workout_exercises,
          exercise_sets: summary.summary.exercise_sets,
          profile: 1,
        },
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error occurred',
        deleted_counts: {
          activities: 0,
          activity_rewards: 0,
          user_badges: 0,
          staking: 0,
          meals: 0,
          energy: 0,
          goals: 0,
          social_posts: 0,
          connections: 0,
          post_likes: 0,
          post_comments: 0,
          workouts: 0,
          workout_exercises: 0,
          exercise_sets: 0,
          profile: 0,
        },
      };
    }
  }
}

/**
 * Check if user has any data in the system
 */
export async function userHasData({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<boolean> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Invalid address provided');
  }

  const summary = await getUserDataSummary({ address, client });

  if (!summary.exists) {
    return false;
  }

  const {
    activities,
    activity_rewards,
    user_badges,
    staking,
    meals,
    energy,
    goals,
    social_posts,
    connections,
    post_likes,
    post_comments,
    workouts,
    workout_exercises,
    exercise_sets,
  } = summary.summary;

  return (
    activities > 0 ||
    activity_rewards > 0 ||
    user_badges > 0 ||
    staking > 0 ||
    meals > 0 ||
    energy > 0 ||
    goals > 0 ||
    social_posts > 0 ||
    connections > 0 ||
    post_likes > 0 ||
    post_comments > 0 ||
    workouts > 0 ||
    workout_exercises > 0 ||
    exercise_sets > 0
  );
}

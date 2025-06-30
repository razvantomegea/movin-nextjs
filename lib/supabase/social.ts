import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export interface ISocialPost {
  id: string;
  address: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // Joined data from profiles table
  profile?: {
    username: string;
    avatar_url: string;
  };
  // Engagement data
  likes_count?: number;
  dislikes_count?: number;
  comments_count?: number;
  user_reaction?: 'like' | 'dislike' | null; // Current user's reaction
  user_has_liked?: boolean; // Legacy support
}

export interface ISocialPostInput {
  content: string;
  image_url?: string;
}

export interface IPostLike {
  id: string;
  post_id: string;
  address: string;
  is_like: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url: string;
  };
}

export interface IPostComment {
  id: string;
  post_id: string;
  address: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url: string;
  };
  replies?: IPostComment[];
  replies_count?: number;
}

export interface IPostCommentInput {
  content: string;
  parent_comment_id?: string;
}

/**
 * Get social feed posts for the current user (their posts + connections' posts)
 * Now includes likes, dislikes, and comments counts
 */
export async function getSocialFeed({
  address,
  limit = 20,
  offset = 0,
  client,
}: {
  address: string;
  limit?: number;
  offset?: number;
  client?: SupabaseClient;
}): Promise<ISocialPost[]> {
  if (!client) {
    client = getClient();
  }

  // Get posts with engagement data
  const { data, error } = await client
    .from('social_posts')
    .select(
      `
      *,
      profile:profiles!social_posts_address_fkey (
        username,
        avatar_url
      ),
      likes_count:post_likes(count),
      dislikes_count:post_likes(count),
      comments_count:post_comments(count)
    `,
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  if (!data) return [];

  // Get user's reactions for each post to determine their interaction state
  const postIds = data.map((post) => post.id);
  const { data: userReactions } = await client
    .from('post_likes')
    .select('post_id, is_like')
    .eq('address', address.toLowerCase())
    .in('post_id', postIds);

  // Process the data to include proper counts and user reactions
  const processedPosts = await Promise.all(
    data.map(async (post) => {
      // Get actual counts
      const [{ data: likes }, { data: dislikes }, { data: comments }] = await Promise.all([
        client!
          .from('post_likes')
          .select('id', { count: 'exact' })
          .eq('post_id', post.id)
          .eq('is_like', true),
        client!
          .from('post_likes')
          .select('id', { count: 'exact' })
          .eq('post_id', post.id)
          .eq('is_like', false),
        client!.from('post_comments').select('id', { count: 'exact' }).eq('post_id', post.id),
      ]);

      // Find user's reaction
      const userReaction = userReactions?.find((reaction) => reaction.post_id === post.id);

      return {
        ...post,
        likes_count: likes?.length || 0,
        dislikes_count: dislikes?.length || 0,
        comments_count: comments?.length || 0,
        user_reaction: userReaction ? (userReaction.is_like ? 'like' : 'dislike') : null,
        user_has_liked: userReaction?.is_like || false,
      };
    }),
  );

  return processedPosts;
}

/**
 * Get posts by a specific user
 */
export async function getUserPosts({
  targetAddress,
  limit = 20,
  offset = 0,
  client,
}: {
  targetAddress: string;
  limit?: number;
  offset?: number;
  client?: SupabaseClient;
}): Promise<ISocialPost[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('social_posts')
    .select(
      `
      *,
      profile:profiles!social_posts_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .eq('address', targetAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create a new social post
 */
export async function createSocialPost({
  address,
  postData,
  client,
}: {
  address: string;
  postData: ISocialPostInput;
  client?: SupabaseClient;
}): Promise<ISocialPost> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('social_posts')
    .insert({
      address: address.toLowerCase(),
      content: postData.content,
      image_url: postData.image_url,
    })
    .select(
      `
      *,
      profile:profiles!social_posts_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a social post
 */
export async function updateSocialPost({
  postId,
  address,
  postData,
  client,
}: {
  postId: string;
  address: string;
  postData: Partial<ISocialPostInput>;
  client?: SupabaseClient;
}): Promise<ISocialPost> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('social_posts')
    .update({
      content: postData.content,
      image_url: postData.image_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('address', address.toLowerCase()) // Ensure user can only update their own posts
    .select(
      `
      *,
      profile:profiles!social_posts_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a social post
 */
export async function deleteSocialPost({
  postId,
  address,
  client,
}: {
  postId: string;
  address: string;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  const { error } = await client
    .from('social_posts')
    .delete()
    .eq('id', postId)
    .eq('address', address.toLowerCase()); // Ensure user can only delete their own posts

  if (error) {
    throw error;
  }
}

/**
 * Get a single post by ID with engagement data
 */
export async function getSocialPost({
  postId,
  address,
  client,
}: {
  postId: string;
  address?: string;
  client?: SupabaseClient;
}): Promise<ISocialPost | null> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('social_posts')
    .select(
      `
      *,
      profile:profiles!social_posts_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Post not found
    }
    throw error;
  }

  if (!data) return null;

  // Get engagement data
  const [{ data: likes }, { data: dislikes }, { data: comments }] = await Promise.all([
    client!
      .from('post_likes')
      .select('id', { count: 'exact' })
      .eq('post_id', postId)
      .eq('is_like', true),
    client!
      .from('post_likes')
      .select('id', { count: 'exact' })
      .eq('post_id', postId)
      .eq('is_like', false),
    client!.from('post_comments').select('id', { count: 'exact' }).eq('post_id', postId),
  ]);

  // Get user's reaction if address is provided
  let userReaction: 'like' | 'dislike' | null = null;
  if (address) {
    const { data: reactionData } = await client
      .from('post_likes')
      .select('is_like')
      .eq('post_id', postId)
      .eq('address', address.toLowerCase())
      .single();

    if (reactionData) {
      userReaction = reactionData.is_like ? 'like' : 'dislike';
    }
  }

  return {
    ...data,
    likes_count: likes?.length || 0,
    dislikes_count: dislikes?.length || 0,
    comments_count: comments?.length || 0,
    user_reaction: userReaction,
    user_has_liked: userReaction === 'like',
  };
}

/**
 * Upload post image to Supabase storage
 */
export async function uploadPostImage({
  file,
  userId,
  client,
}: {
  file: File;
  userId: string;
  client?: SupabaseClient;
}): Promise<string> {
  if (!client) {
    client = getClient();
  }

  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `social-posts/${fileName}`;

  // Upload file
  const { error: uploadError } = await client.storage.from('public').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data } = client.storage.from('public').getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete post image from Supabase storage
 */
export async function deletePostImage({
  imageUrl,
  client,
}: {
  imageUrl: string;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex((part) => part === 'public');
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL format');
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    // Delete file
    const { error } = await client.storage.from('public').remove([filePath]);

    if (error) {
      console.warn('Failed to delete post image:', error);
      // Don't throw error for file deletion failures
    }
  } catch (error) {
    console.warn('Failed to parse or delete post image:', error);
    // Don't throw error for file deletion failures
  }
}

// ==================== LIKES/DISLIKES FUNCTIONS ====================

/**
 * Like or dislike a post
 */
export async function togglePostReaction({
  postId,
  address,
  isLike,
  client,
}: {
  postId: string;
  address: string;
  isLike: boolean;
  client?: SupabaseClient;
}): Promise<{ action: 'added' | 'updated' | 'removed'; reaction: 'like' | 'dislike' | null }> {
  if (!client) {
    client = getClient();
  }

  // Check if user already has a reaction
  const { data: existingReaction } = await client
    .from('post_likes')
    .select('*')
    .eq('post_id', postId)
    .eq('address', address.toLowerCase())
    .single();

  if (existingReaction) {
    // If same reaction, remove it
    if (existingReaction.is_like === isLike) {
      const { error } = await client.from('post_likes').delete().eq('id', existingReaction.id);

      if (error) throw error;
      return { action: 'removed', reaction: null };
    } else {
      // If different reaction, update it
      const { error } = await client
        .from('post_likes')
        .update({ is_like: isLike, updated_at: new Date().toISOString() })
        .eq('id', existingReaction.id);

      if (error) throw error;
      return { action: 'updated', reaction: isLike ? 'like' : 'dislike' };
    }
  } else {
    // Add new reaction
    const { error } = await client.from('post_likes').insert({
      post_id: postId,
      address: address.toLowerCase(),
      is_like: isLike,
    });

    if (error) throw error;
    return { action: 'added', reaction: isLike ? 'like' : 'dislike' };
  }
}

/**
 * Get likes for a specific post
 */
export async function getPostLikes({
  postId,
  client,
}: {
  postId: string;
  client?: SupabaseClient;
}): Promise<{ likes: IPostLike[]; dislikes: IPostLike[] }> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('post_likes')
    .select(
      `
      *,
      profile:profiles!post_likes_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const likes = (data || []).filter((like) => like.is_like);
  const dislikes = (data || []).filter((like) => !like.is_like);

  return { likes, dislikes };
}

/**
 * Get user's reaction to a specific post
 */
export async function getUserPostReaction({
  postId,
  address,
  client,
}: {
  postId: string;
  address: string;
  client?: SupabaseClient;
}): Promise<'like' | 'dislike' | null> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('post_likes')
    .select('is_like')
    .eq('post_id', postId)
    .eq('address', address.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No reaction found
    }
    throw error;
  }

  return data.is_like ? 'like' : 'dislike';
}

// ==================== COMMENTS FUNCTIONS ====================

/**
 * Get comments for a specific post
 */
export async function getPostComments({
  postId,
  client,
}: {
  postId: string;
  client?: SupabaseClient;
}): Promise<IPostComment[]> {
  if (!client) {
    client = getClient();
  }

  // Fetch all comments for the post, including replies
  const { data, error } = await client
    .from('post_comments')
    .select(
      `
      *,
      profile:profiles!post_comments_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data || [];
}

/**
 * Create a new comment
 */
export async function createComment({
  postId,
  address,
  commentData,
  client,
}: {
  postId: string;
  address: string;
  commentData: IPostCommentInput;
  client?: SupabaseClient;
}): Promise<IPostComment> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('post_comments')
    .insert({
      post_id: postId,
      address: address.toLowerCase(),
      content: commentData.content,
      parent_comment_id: commentData.parent_comment_id || null,
    })
    .select(
      `
      *,
      profile:profiles!post_comments_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) throw error;

  return {
    ...data,
    replies: [],
    replies_count: 0,
  };
}

/**
 * Update a comment
 */
export async function updateComment({
  commentId,
  address,
  content,
  client,
}: {
  commentId: string;
  address: string;
  content: string;
  client?: SupabaseClient;
}): Promise<IPostComment> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('post_comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('address', address.toLowerCase()) // Ensure user can only update their own comments
    .select(
      `
      *,
      profile:profiles!post_comments_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) throw error;

  return data;
}

/**
 * Delete a comment
 */
export async function deleteComment({
  commentId,
  address,
  client,
}: {
  commentId: string;
  address: string;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  const { error } = await client
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('address', address.toLowerCase()); // Ensure user can only delete their own comments

  if (error) throw error;
}

/**
 * Get comment replies
 */
export async function getCommentReplies({
  commentId,
  limit = 10,
  offset = 0,
  client,
}: {
  commentId: string;
  limit?: number;
  offset?: number;
  client?: SupabaseClient;
}): Promise<IPostComment[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('post_comments')
    .select(
      `
      *,
      profile:profiles!post_comments_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .eq('parent_comment_id', commentId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data || []).map((reply) => ({
    ...reply,
    replies: [],
    replies_count: 0,
  }));
}

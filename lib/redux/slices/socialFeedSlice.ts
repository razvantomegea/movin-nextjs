import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import * as Sentry from '@sentry/nextjs';
import {
  getUserConnections,
  searchUsers,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  removeConnection,
  getPendingConnections,
  type IConnection,
  type ConnectionStatus,
} from '@/lib/supabase/connections';
import {
  getSocialFeed,
  createSocialPost,
  deleteSocialPost,
  uploadPostImage,
  togglePostReaction,
  getPostComments,
  createComment,
  deleteComment,
  updateComment,
  getSocialPost,
  type ISocialPostInput,
  type IPostCommentInput,
} from '@/lib/supabase/social';
import { RootState } from '../store';
import type { AppDispatch } from '../store';

// Types
export interface SocialPost {
  id: string;
  address: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url: string;
  };
  // Engagement data
  likes_count?: number;
  dislikes_count?: number;
  comments_count?: number;
  user_reaction?: 'like' | 'dislike' | null;
  user_has_liked?: boolean; // Legacy support
}

export interface PostComment {
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
  replies?: PostComment[];
  replies_count?: number;
}

export interface ConnectionUser {
  address: string;
  username: string;
  avatar_url: string;
  connection_status?: ConnectionStatus;
  connection_id?: string;
}

interface SocialFeedState {
  posts: SocialPost[];
  connections: ConnectionUser[];
  searchResults: ConnectionUser[];
  pendingConnections: {
    sent: IConnection[];
    received: IConnection[];
  };
  // Comments state
  postComments: Record<string, PostComment[]>; // postId -> comments
  commentReplies: Record<string, PostComment[]>; // commentId -> replies
  // Single post view
  currentPost: SocialPost | null;
  isLoadingPost: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isSearching: boolean;
  isPostingImage: boolean;
  isLoadingComments: Record<string, boolean>; // postId -> loading state
  isSubmittingComment: Record<string, boolean>; // postId -> submitting state
  error: string | null;
  // For optimistic updates
  optimisticallyRemovedComments: Record<string, Record<string, PostComment>>; // { [postId]: { [commentId]: PostComment } }
}

// Async thunks
export const fetchSocialFeed = createAsyncThunk<SocialPost[], string, { rejectValue: string }>(
  'socialFeed/fetchSocialFeed',
  async (address, { rejectWithValue }) => {
    try {
      const posts = await getSocialFeed({ address });
      return posts;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue('Failed to fetch social feed. Please try again.');
    }
  },
);

export const refreshSocialFeed = createAsyncThunk<SocialPost[], string, { rejectValue: string }>(
  'socialFeed/refreshSocialFeed',
  async (address, { rejectWithValue }) => {
    try {
      const posts = await getSocialFeed({ address });
      return posts;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue('Failed to refresh social feed. Please try again.');
    }
  },
);

export const createPost = createAsyncThunk<
  SocialPost,
  { address: string; postData: ISocialPostInput },
  { rejectValue: string }
>('socialFeed/createPost', async ({ address, postData }, { rejectWithValue }) => {
  try {
    const post = await createSocialPost({ address, postData });
    return post;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to create post. Please try again.');
  }
});

export const uploadPostImageAsync = createAsyncThunk<
  string,
  { file: File; userId: string },
  { rejectValue: string }
>('socialFeed/uploadPostImage', async ({ file, userId }, { rejectWithValue }) => {
  try {
    const imageUrl = await uploadPostImage({ file, userId });
    return imageUrl;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
    );
  }
});

export const deletePost = createAsyncThunk<
  string,
  { postId: string; address: string },
  { rejectValue: string }
>('socialFeed/deletePost', async ({ postId, address }, { rejectWithValue }) => {
  try {
    await deleteSocialPost({ postId, address });
    return postId;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to delete post. Please try again.');
  }
});

// Connection thunks
export const fetchConnections = createAsyncThunk<ConnectionUser[], string, { rejectValue: string }>(
  'socialFeed/fetchConnections',
  async (address, { rejectWithValue }) => {
    try {
      const connections = await getUserConnections({ address });
      return connections;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue('Failed to fetch connections. Please try again.');
    }
  },
);

export const searchUsersAsync = createAsyncThunk<
  ConnectionUser[],
  { currentUserAddress: string; searchTerm: string },
  { rejectValue: string }
>('socialFeed/searchUsers', async ({ currentUserAddress, searchTerm }, { rejectWithValue }) => {
  try {
    const users = await searchUsers({ currentUserAddress, searchTerm });
    return users;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to search users. Please try again.');
  }
});

export const sendConnectionRequestAsync = createAsyncThunk<
  IConnection,
  { requesterAddress: string; addresseeAddress: string },
  { rejectValue: string }
>(
  'socialFeed/sendConnectionRequest',
  async ({ requesterAddress, addresseeAddress }, { rejectWithValue }) => {
    try {
      const connection = await sendConnectionRequest({ requesterAddress, addresseeAddress });
      return connection;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue('Failed to send connection request. Please try again.');
    }
  },
);

export const acceptConnectionRequestAsync = createAsyncThunk<
  IConnection,
  { connectionId: string; addresseeAddress: string },
  { rejectValue: string }
>(
  'socialFeed/acceptConnectionRequest',
  async ({ connectionId, addresseeAddress }, { rejectWithValue }) => {
    try {
      const connection = await acceptConnectionRequest({ connectionId, addresseeAddress });
      return connection;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue('Failed to accept connection request. Please try again.');
    }
  },
);

export const declineConnectionRequestAsync = createAsyncThunk<
  IConnection,
  { connectionId: string; addresseeAddress: string },
  { rejectValue: string }
>(
  'socialFeed/declineConnectionRequest',
  async ({ connectionId, addresseeAddress }, { rejectWithValue }) => {
    try {
      const connection = await declineConnectionRequest({ connectionId, addresseeAddress });
      return connection;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue('Failed to decline connection request. Please try again.');
    }
  },
);

export const removeConnectionAsync = createAsyncThunk<
  string,
  { connectionId: string; userAddress: string },
  { rejectValue: string }
>('socialFeed/removeConnection', async ({ connectionId, userAddress }, { rejectWithValue }) => {
  try {
    await removeConnection({ connectionId, userAddress });
    return connectionId;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to remove connection. Please try again.');
  }
});

export const fetchPendingConnections = createAsyncThunk<
  { sent: IConnection[]; received: IConnection[] },
  string,
  { rejectValue: string }
>('socialFeed/fetchPendingConnections', async (address, { rejectWithValue }) => {
  try {
    const pendingConnections = await getPendingConnections({ address });
    return pendingConnections;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to fetch pending connections. Please try again.');
  }
});

// ==================== LIKES/DISLIKES THUNKS ====================

export const togglePostReactionAsync = createAsyncThunk<
  { postId: string; action: 'added' | 'updated' | 'removed'; reaction: 'like' | 'dislike' | null },
  { postId: string; address: string; isLike: boolean },
  { rejectValue: string }
>('socialFeed/togglePostReaction', async ({ postId, address, isLike }, { rejectWithValue }) => {
  try {
    const result = await togglePostReaction({ postId, address, isLike });
    return { postId, ...result };
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to update reaction. Please try again.');
  }
});

// ==================== COMMENTS THUNKS ====================

export const fetchPostComments = createAsyncThunk<
  { postId: string; comments: PostComment[] },
  { postId: string },
  { rejectValue: string }
>('socialFeed/fetchPostComments', async ({ postId }, { rejectWithValue }) => {
  try {
    const comments = await getPostComments({ postId });
    return { postId, comments };
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to fetch comments. Please try again.');
  }
});

export const createCommentAsync = createAsyncThunk<
  { postId: string; comment: PostComment },
  { postId: string; address: string; commentData: IPostCommentInput },
  { rejectValue: string }
>('socialFeed/createComment', async ({ postId, address, commentData }, { rejectWithValue }) => {
  try {
    const comment = await createComment({ postId, address, commentData });
    return { postId, comment };
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to create comment. Please try again.');
  }
});

export const updateCommentAsync = createAsyncThunk<
  PostComment,
  { commentId: string; address: string; content: string },
  { rejectValue: string }
>('socialFeed/updateComment', async ({ commentId, address, content }, { rejectWithValue }) => {
  try {
    const comment = await updateComment({ commentId, address, content });
    return comment;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to update comment. Please try again.');
  }
});

export const deleteCommentAsync = createAsyncThunk<
  { commentId: string; postId: string },
  { commentId: string; address: string; postId: string },
  { rejectValue: string }
>('socialFeed/deleteComment', async ({ commentId, address, postId }, { rejectWithValue }) => {
  try {
    await deleteComment({ commentId, address });
    return { commentId, postId };
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to delete comment. Please try again.');
  }
});

// Thunk to fetch a single post by ID
export const fetchSocialPost = createAsyncThunk<
  SocialPost,
  { postId: string; address?: string },
  { rejectValue: string }
>('socialFeed/fetchSocialPost', async ({ postId, address }, { rejectWithValue }) => {
  try {
    const post = await getSocialPost({ postId, address });
    if (!post) {
      return rejectWithValue('Post not found.');
    }
    return post;
  } catch (error) {
    Sentry.captureException(error);
    return rejectWithValue('Failed to fetch post. Please try again.');
  }
});

// Initial state
const initialState: SocialFeedState = {
  posts: [],
  connections: [],
  searchResults: [],
  pendingConnections: {
    sent: [],
    received: [],
  },
  postComments: {},
  commentReplies: {},
  // Single post view
  currentPost: null,
  isLoadingPost: false,
  isLoading: false,
  isRefreshing: false,
  isSearching: false,
  isPostingImage: false,
  isLoadingComments: {},
  isSubmittingComment: {},
  error: null,
  // For optimistic updates
  optimisticallyRemovedComments: {}, // { [postId]: { [commentId]: PostComment } }
};

// Slice
const socialFeedSlice = createSlice({
  name: 'socialFeed',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    updateSearchResultConnectionStatus: (
      state,
      action: PayloadAction<{ address: string; status: ConnectionStatus; connectionId?: string }>,
    ) => {
      const user = state.searchResults.find((user) => user.address === action.payload.address);
      if (user) {
        user.connection_status = action.payload.status;
        user.connection_id = action.payload.connectionId;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch social feed
      .addCase(fetchSocialFeed.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSocialFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchSocialFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Refresh social feed
      .addCase(refreshSocialFeed.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshSocialFeed.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.posts = action.payload;
      })
      .addCase(refreshSocialFeed.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.payload as string;
      })

      // Fetch single post
      .addCase(fetchSocialPost.pending, (state) => {
        state.isLoadingPost = true;
        state.error = null;
      })
      .addCase(fetchSocialPost.fulfilled, (state, action) => {
        state.isLoadingPost = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchSocialPost.rejected, (state, action) => {
        state.isLoadingPost = false;
        state.error = action.payload as string;
      })

      // Create post
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Upload post image
      .addCase(uploadPostImageAsync.pending, (state) => {
        state.isPostingImage = true;
        state.error = null;
      })
      .addCase(uploadPostImageAsync.fulfilled, (state) => {
        state.isPostingImage = false;
      })
      .addCase(uploadPostImageAsync.rejected, (state, action) => {
        state.isPostingImage = false;
        state.error = action.payload as string;
      })

      // Delete post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((post) => post.id !== action.payload);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Fetch connections
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.connections = action.payload;
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Search users
      .addCase(searchUsersAsync.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchUsersAsync.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsersAsync.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })

      // Send connection request
      .addCase(sendConnectionRequestAsync.fulfilled, (state, action) => {
        state.pendingConnections.sent.push(action.payload);
      })
      .addCase(sendConnectionRequestAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Accept connection request
      .addCase(acceptConnectionRequestAsync.fulfilled, (state, action) => {
        // Remove from pending received
        state.pendingConnections.received = state.pendingConnections.received.filter(
          (conn) => conn.id !== action.payload.id,
        );
        // Add to connections
        const connection = action.payload;
        const connectedProfile = connection.requester_profile;
        if (connectedProfile) {
          state.connections.push({
            address: connection.requester_address,
            username: connectedProfile.username,
            avatar_url: connectedProfile.avatar_url,
            connection_status: 'accepted',
            connection_id: connection.id,
          });
        }
      })
      .addCase(acceptConnectionRequestAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Decline connection request
      .addCase(declineConnectionRequestAsync.fulfilled, (state, action) => {
        state.pendingConnections.received = state.pendingConnections.received.filter(
          (conn) => conn.id !== action.payload.id,
        );
      })
      .addCase(declineConnectionRequestAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Remove connection
      .addCase(removeConnectionAsync.fulfilled, (state, action) => {
        const connectionId = action.payload;
        // Remove from connections
        state.connections = state.connections.filter((conn) => conn.connection_id !== connectionId);
        // Remove from pending sent
        state.pendingConnections.sent = state.pendingConnections.sent.filter(
          (conn) => conn.id !== connectionId,
        );
        // Remove from pending received
        state.pendingConnections.received = state.pendingConnections.received.filter(
          (conn) => conn.id !== connectionId,
        );
      })
      .addCase(removeConnectionAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Fetch pending connections
      .addCase(fetchPendingConnections.fulfilled, (state, action) => {
        state.pendingConnections = action.payload;
      })
      .addCase(fetchPendingConnections.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // ==================== LIKES/DISLIKES REDUCERS ====================

      // Toggle post reaction
      .addCase(togglePostReactionAsync.fulfilled, (state, action) => {
        const { postId, action: reactionAction, reaction } = action.payload;

        // Update reaction counts for post in posts array
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          // Update user reaction
          post.user_reaction = reaction;
          post.user_has_liked = reaction === 'like';

          // Update counts based on action
          if (reactionAction === 'added') {
            if (reaction === 'like') {
              post.likes_count = (post.likes_count || 0) + 1;
            } else if (reaction === 'dislike') {
              post.dislikes_count = (post.dislikes_count || 0) + 1;
            }
          } else if (reactionAction === 'removed') {
            if (reaction === null) {
              // We need to know what was removed, check previous state
              const { isLike } = action.meta.arg;
              if (isLike) {
                post.likes_count = Math.max((post.likes_count || 0) - 1, 0);
              } else {
                post.dislikes_count = Math.max((post.dislikes_count || 0) - 1, 0);
              }
            }
          } else if (reactionAction === 'updated') {
            const { isLike } = action.meta.arg;
            if (isLike) {
              // Changed from dislike to like
              post.likes_count = (post.likes_count || 0) + 1;
              post.dislikes_count = Math.max((post.dislikes_count || 0) - 1, 0);
            } else {
              // Changed from like to dislike
              post.dislikes_count = (post.dislikes_count || 0) + 1;
              post.likes_count = Math.max((post.likes_count || 0) - 1, 0);
            }
          }
        }

        // Also update the current post if it matches
        if (state.currentPost && state.currentPost.id === postId) {
          // Update user reaction
          state.currentPost.user_reaction = reaction;
          state.currentPost.user_has_liked = reaction === 'like';

          // Update counts based on action
          if (reactionAction === 'added') {
            if (reaction === 'like') {
              state.currentPost.likes_count = (state.currentPost.likes_count || 0) + 1;
            } else if (reaction === 'dislike') {
              state.currentPost.dislikes_count = (state.currentPost.dislikes_count || 0) + 1;
            }
          } else if (reactionAction === 'removed') {
            if (reaction === null) {
              // We need to know what was removed, check previous state
              const { isLike } = action.meta.arg;
              if (isLike) {
                state.currentPost.likes_count = Math.max(
                  (state.currentPost.likes_count || 0) - 1,
                  0,
                );
              } else {
                state.currentPost.dislikes_count = Math.max(
                  (state.currentPost.dislikes_count || 0) - 1,
                  0,
                );
              }
            }
          } else if (reactionAction === 'updated') {
            const { isLike } = action.meta.arg;
            if (isLike) {
              // Changed from dislike to like
              state.currentPost.likes_count = (state.currentPost.likes_count || 0) + 1;
              state.currentPost.dislikes_count = Math.max(
                (state.currentPost.dislikes_count || 0) - 1,
                0,
              );
            } else {
              // Changed from like to dislike
              state.currentPost.dislikes_count = (state.currentPost.dislikes_count || 0) + 1;
              state.currentPost.likes_count = Math.max((state.currentPost.likes_count || 0) - 1, 0);
            }
          }
        }
      })
      .addCase(togglePostReactionAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // ==================== COMMENTS REDUCERS ====================

      // Fetch post comments
      .addCase(fetchPostComments.pending, (state, action) => {
        const { postId } = action.meta.arg;
        state.isLoadingComments[postId] = true;
        state.error = null;
      })
      .addCase(fetchPostComments.fulfilled, (state, action) => {
        const { postId, comments } = action.payload;
        state.isLoadingComments[postId] = false;
        state.postComments[postId] = nestComments(comments);
      })
      .addCase(fetchPostComments.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.isLoadingComments[postId] = false;
        state.error = action.payload as string;
      })

      // Create comment
      .addCase(createCommentAsync.pending, (state, action) => {
        const { postId } = action.meta.arg;
        state.isSubmittingComment[postId] = true;
        state.error = null;
      })
      .addCase(createCommentAsync.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        const { postId: metaPostId } = action.meta.arg;
        state.isSubmittingComment[metaPostId] = false;

        // Update post comment count in posts array
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.comments_count = (post.comments_count || 0) + 1;
        }

        // Also update the current post if it matches
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost.comments_count = (state.currentPost.comments_count || 0) + 1;
        }

        // Add comment to comments list if it exists
        if (state.postComments[postId]) {
          if (comment.parent_comment_id) {
            // This is a reply, add it to the nested structure
            const parentComment = state.postComments[postId].find(
              (c) => c.id === comment.parent_comment_id,
            );
            if (parentComment) {
              if (!parentComment.replies) {
                parentComment.replies = [];
              }
              parentComment.replies.push(comment);
              parentComment.replies_count = (parentComment.replies_count || 0) + 1;
            }
          } else {
            // This is a top-level comment
            state.postComments[postId].push({ ...comment, replies: [] });
          }
        }
      })
      .addCase(createCommentAsync.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.isSubmittingComment[postId] = false;
        state.error = action.payload as string;
      })

      // Update comment
      .addCase(updateCommentAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Optimistic delete (pending)
      .addCase(deleteCommentAsync.pending, (state, action) => {
        const { commentId, postId } = action.meta.arg;
        if (!state.optimisticallyRemovedComments[postId]) {
          state.optimisticallyRemovedComments[postId] = {};
        }
        if (state.postComments[postId]) {
          // Try to remove from top-level
          const topLevelIndex = state.postComments[postId].findIndex(
            (comment) => comment.id === commentId,
          );
          if (topLevelIndex !== -1) {
            // Save for rollback
            state.optimisticallyRemovedComments[postId][commentId] =
              state.postComments[postId][topLevelIndex];
            state.postComments[postId].splice(topLevelIndex, 1);
          } else {
            // Try to remove from replies
            for (const comment of state.postComments[postId]) {
              if (comment.replies) {
                const replyIndex = comment.replies.findIndex((reply) => reply.id === commentId);
                if (replyIndex !== -1) {
                  // Save for rollback
                  state.optimisticallyRemovedComments[postId][commentId] =
                    comment.replies[replyIndex];
                  comment.replies.splice(replyIndex, 1);
                  comment.replies_count = Math.max((comment.replies_count || 0) - 1, 0);
                  break;
                }
              }
            }
          }
        }
      })
      // Delete comment fulfilled (do nothing, already removed)
      .addCase(deleteCommentAsync.fulfilled, (state, action) => {
        const { commentId, postId } = action.payload;
        // Remove from rollback state
        if (state.optimisticallyRemovedComments[postId]) {
          delete state.optimisticallyRemovedComments[postId][commentId];
        }
        // Update post comment count in posts array
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.comments_count = Math.max((post.comments_count || 0) - 1, 0);
        }

        // Also update the current post if it matches
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost.comments_count = Math.max(
            (state.currentPost.comments_count || 0) - 1,
            0,
          );
        }
      })
      // Delete comment rejected (restore comment)
      .addCase(deleteCommentAsync.rejected, (state, action) => {
        const { commentId, postId } = action.meta.arg;
        const removed = state.optimisticallyRemovedComments[postId]?.[commentId];
        if (removed && state.postComments[postId]) {
          if (!removed.parent_comment_id) {
            // Restore as top-level
            state.postComments[postId].unshift(removed);
          } else {
            // Restore as reply
            const parent = state.postComments[postId].find(
              (c) => c.id === removed.parent_comment_id,
            );
            if (parent) {
              if (!parent.replies) parent.replies = [];
              parent.replies.unshift(removed);
              parent.replies_count = (parent.replies_count || 0) + 1;
            }
          }
        }
        if (state.optimisticallyRemovedComments[postId]) {
          delete state.optimisticallyRemovedComments[postId][commentId];
        }
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSearchResults, updateSearchResultConnectionStatus } =
  socialFeedSlice.actions;
export default socialFeedSlice.reducer;

// ==================== MEMOIZED SELECTORS ====================

// Empty arrays to avoid creating new references
const EMPTY_COMMENTS_ARRAY: PostComment[] = [];

// Helper to nest comments into a tree structure
function nestComments(comments: PostComment[]): PostComment[] {
  const commentMap: Record<string, PostComment & { replies: PostComment[] }> = {};
  const roots: PostComment[] = [];

  // Initialize map and add empty replies array
  comments.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // Build the tree
  comments.forEach((comment) => {
    if (comment.parent_comment_id) {
      const parent = commentMap[comment.parent_comment_id];
      if (parent) {
        parent.replies.push(commentMap[comment.id]);
      }
    } else {
      roots.push(commentMap[comment.id]);
    }
  });

  return roots;
}

// Memoized selector for post comments
export const makeSelectPostComments = () =>
  createSelector(
    [(state: RootState) => state.socialFeed.postComments, (_: RootState, postId: string) => postId],
    (postComments: Record<string, PostComment[]>, postId: string) =>
      postComments[postId] || EMPTY_COMMENTS_ARRAY,
  );

// Memoized selector for loading comments state
export const makeSelectIsLoadingComments = () =>
  createSelector(
    [
      (state: RootState) => state.socialFeed.isLoadingComments,
      (_: RootState, postId: string) => postId,
    ],
    (isLoadingComments: Record<string, boolean>, postId: string) =>
      isLoadingComments[postId] || false,
  );

// Memoized selector for submitting comment state
export const makeSelectIsSubmittingComment = () =>
  createSelector(
    [
      (state: RootState) => state.socialFeed.isSubmittingComment,
      (_: RootState, postId: string) => postId,
    ],
    (isSubmittingComment: Record<string, boolean>, postId: string) =>
      isSubmittingComment[postId] || false,
  );

// Thunk wrappers to always refetch post after like/dislike or comment mutations
export const togglePostReactionAndRefetch =
  (params: { postId: string; address: string; isLike: boolean }) =>
  async (dispatch: AppDispatch) => {
    const result = await dispatch(togglePostReactionAsync(params));
    if (togglePostReactionAsync.fulfilled.match(result)) {
      await dispatch(fetchSocialPost({ postId: params.postId, address: params.address }));
    }
    return result;
  };

export const createCommentAndRefetch =
  (params: { postId: string; address: string; commentData: IPostCommentInput }) =>
  async (dispatch: AppDispatch) => {
    const result = await dispatch(createCommentAsync(params));
    if (createCommentAsync.fulfilled.match(result)) {
      await dispatch(fetchSocialPost({ postId: params.postId, address: params.address }));
    }
    return result;
  };

export const updateCommentAndRefetch =
  (params: { commentId: string; address: string; content: string; postId: string }) =>
  async (dispatch: AppDispatch) => {
    const result = await dispatch(updateCommentAsync(params));
    if (updateCommentAsync.fulfilled.match(result)) {
      await dispatch(fetchSocialPost({ postId: params.postId, address: params.address }));
    }
    return result;
  };

export const deleteCommentAndRefetch =
  (params: { commentId: string; address: string; postId: string }) =>
  async (dispatch: AppDispatch) => {
    const result = await dispatch(deleteCommentAsync(params));
    if (deleteCommentAsync.fulfilled.match(result)) {
      await dispatch(fetchSocialPost({ postId: params.postId, address: params.address }));
    }
    return result;
  };

// Selectors for single post view
export const selectCurrentPost = (state: RootState) => state.socialFeed.currentPost;
export const selectIsLoadingPost = (state: RootState) => state.socialFeed.isLoadingPost;

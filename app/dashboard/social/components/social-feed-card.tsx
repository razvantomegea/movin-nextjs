'use client';

import { useState, useMemo } from 'react';
import {
  MessageCircle,
  Share,
  ThumbsUp,
  ThumbsDown,
  Send,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { useAccount } from 'wagmi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { useReduxToast } from '@/lib/hooks/use-redux-toast';
import {
  togglePostReactionAsync,
  fetchPostComments,
  createCommentAsync,
  makeSelectPostComments,
  makeSelectIsLoadingComments,
  makeSelectIsSubmittingComment,
  createPost,
  deletePost,
  type SocialPost,
} from '@/lib/redux/slices/socialFeedSlice';
import type { AppDispatch, RootState } from '@/lib/redux/store';
import { copyToClipboard } from '@/utils/crypto';
import { formatTimeAgo } from '@/utils/time/formatTimeAgo';
import CommentItem from './CommentItem';

interface SocialFeedCardProps {
  post: SocialPost;
}

export function SocialFeedCard({ post }: SocialFeedCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { address } = useAccount();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [repostComment, setRepostComment] = useState('');
  const [isReposting, setIsReposting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success: showSuccessToast, error: showErrorToast } = useReduxToast();

  // Create memoized selector instances
  const selectPostComments = useMemo(() => makeSelectPostComments(), []);
  const selectIsLoadingComments = useMemo(() => makeSelectIsLoadingComments(), []);
  const selectIsSubmittingComment = useMemo(() => makeSelectIsSubmittingComment(), []);

  // Use memoized selectors
  const postComments = useSelector((state: RootState) => selectPostComments(state, post.id));
  const isLoadingComments = useSelector((state: RootState) =>
    selectIsLoadingComments(state, post.id),
  );
  const isSubmittingComment = useSelector((state: RootState) =>
    selectIsSubmittingComment(state, post.id),
  );

  const username = post.profile?.username || 'Unknown User';
  const avatarUrl = post.profile?.avatar_url || '/placeholder.svg';

  const handleLike = () => {
    if (!address) return;
    dispatch(
      togglePostReactionAsync({
        postId: post.id,
        address,
        isLike: true,
      }),
    );
  };

  const handleDislike = () => {
    if (!address) return;
    dispatch(
      togglePostReactionAsync({
        postId: post.id,
        address,
        isLike: false,
      }),
    );
  };

  const handleToggleComments = () => {
    if (!showComments && postComments.length === 0) {
      // Load comments when showing for the first time
      dispatch(fetchPostComments({ postId: post.id }));
    }
    setShowComments(!showComments);
  };

  const handleAddComment = () => {
    if (!address || !newComment.trim()) return;

    dispatch(
      createCommentAsync({
        postId: post.id,
        address,
        commentData: {
          content: newComment.trim(),
        },
      }),
    );
    setNewComment('');
  };

  const handleRepost = async () => {
    if (!address) return;
    setIsReposting(true);
    try {
      const content = `${repostComment ? repostComment + '\n\n' : ''}Repost of @${username}: ${
        post.content
      }`;
      await dispatch(
        createPost({
          address: address.toLowerCase(),
          postData: {
            content,
            image_url: post.image_url,
          },
        }),
      ).unwrap();
      setIsRepostModalOpen(false);
      setRepostComment('');
    } catch (error) {
      // Optionally show error toast
    } finally {
      setIsReposting(false);
    }
  };

  const postUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/dashboard/social/${post.id}` : '';
  const shareText = `${post.profile?.username ? '@' + post.profile.username : ''}: ${post.content}`;

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Movin Social Post',
          text: shareText,
          url: postUrl,
        });
      } else {
        // fallback
        handleCopyLink();
      }
    } catch (e) {
      console.error('Failed to share post:', e);
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText,
    )}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleCopyLink = () => {
    copyToClipboard(postUrl);
    showSuccessToast({
      title: 'Link copied!',
      description: 'The post link has been copied to your clipboard.',
    });
  };

  const handleDelete = async () => {
    if (!address) return;

    setIsDeleting(true);
    try {
      await dispatch(
        deletePost({
          postId: post.id,
          address: address.toLowerCase(),
        }),
      ).unwrap();

      showSuccessToast({
        title: 'Post deleted',
        description: 'Your post has been successfully deleted.',
      });
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      showErrorToast({
        title: 'Delete failed',
        description: 'Failed to delete the post. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if current user is the post creator
  const isCurrentUserPost = address && post.address.toLowerCase() === address.toLowerCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{username}</div>
            <div className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</div>
          </div>
          {isCurrentUserPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="mb-3">{post.content}</p>
        {post.image_url && (
          <div className="relative h-60 w-full rounded-md overflow-hidden mb-2">
            <Image src={post.image_url} alt="Post image" fill className="object-cover" />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-0 flex-col">
        <div className="w-full p-2 border-t flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {post.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown className="h-3 w-3" />
              {post.dislikes_count}
            </span>
          </div>
          <span>
            {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full p-2 border-t flex justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1',
                post.user_reaction === 'like' && 'text-blue-600 bg-blue-50 hover:bg-blue-100',
              )}
              disabled={!address}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Like</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={cn(
                'flex items-center gap-1',
                post.user_reaction === 'dislike' && 'text-red-600 bg-red-50 hover:bg-red-100',
              )}
              disabled={!address}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Dislike</span>
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsRepostModalOpen(true)} disabled={!address}>
                  Repost
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNativeShare}>Share via Device...</DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareTwitter}>Share to Twitter</DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareFacebook}>Share to Facebook</DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>Copy Link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="w-full border-t">
            {/* Add Comment Form */}
            {address && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    disabled={isSubmittingComment}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="p-4 space-y-4">
              {isLoadingComments ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : postComments.length > 0 ? (
                postComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    currentUserAddress={address || ''}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Repost Modal */}
        <Dialog open={isRepostModalOpen} onOpenChange={setIsRepostModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Repost</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Textarea
                  placeholder="Add a comment (optional)"
                  value={repostComment}
                  onChange={(e) => setRepostComment(e.target.value)}
                  rows={3}
                  className="mt-2"
                  disabled={isReposting}
                />
              </div>
              <div className="border rounded p-2 bg-muted">
                <div className="text-xs text-muted-foreground mb-1">Original post:</div>
                <div className="text-sm">{post.content}</div>
                {post.image_url && (
                  <div className="relative h-32 w-full rounded-md overflow-hidden mt-2">
                    <Image src={post.image_url} alt="Post image" fill className="object-cover" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRepostModalOpen(false)}
                disabled={isReposting}
              >
                Cancel
              </Button>
              <Button onClick={handleRepost} disabled={isReposting || !address}>
                {isReposting ? 'Reposting...' : 'Repost'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm line-clamp-3">{post.content}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

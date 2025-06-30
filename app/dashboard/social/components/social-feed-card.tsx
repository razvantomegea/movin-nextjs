'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Share,
  ThumbsUp,
  ThumbsDown,
  Send,
  MoreHorizontal,
  Trash,
} from 'lucide-react';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import type { AppDispatch, RootState } from '@/lib/redux/store';
import {
  togglePostReactionAsync,
  fetchPostComments,
  createCommentAsync,
  deleteCommentAsync,
  type SocialPost,
  type PostComment,
} from '@/lib/redux/slices/socialFeedSlice';

interface SocialFeedCardProps {
  post: SocialPost;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function CommentItem({
  comment,
  postId,
  currentUserAddress,
}: {
  comment: PostComment;
  postId: string;
  currentUserAddress: string;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleDeleteComment = async () => {
    if (comment.address === currentUserAddress) {
      dispatch(
        deleteCommentAsync({
          commentId: comment.id,
          address: currentUserAddress,
          postId,
        }),
      );
    }
  };

  const handleReply = async () => {
    if (replyText.trim()) {
      dispatch(
        createCommentAsync({
          postId,
          address: currentUserAddress,
          commentData: {
            content: replyText.trim(),
            parent_comment_id: comment.id,
          },
        }),
      );
      setReplyText('');
      setIsReplying(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.profile?.avatar_url} alt={comment.profile?.username} />
          <AvatarFallback className="text-xs">
            {comment.profile?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {comment.profile?.username || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.address === currentUserAddress && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDeleteComment} className="text-red-600">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => setIsReplying(!isReplying)}
            >
              Reply
            </Button>
            {comment.replies_count && comment.replies_count > 0 && (
              <span className="text-xs text-muted-foreground">
                {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="ml-8 flex items-center gap-2">
          <Input
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
            className="h-8 text-sm"
          />
          <Button onClick={handleReply} size="sm" disabled={!replyText.trim()}>
            <Send className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserAddress={currentUserAddress}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SocialFeedCard({ post }: SocialFeedCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { address } = useWallet();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const postComments = useSelector(
    (state: RootState) => state.socialFeed.postComments[post.id] || [],
  );
  const isLoadingComments = useSelector(
    (state: RootState) => state.socialFeed.isLoadingComments[post.id] || false,
  );
  const isSubmittingComment = useSelector(
    (state: RootState) => state.socialFeed.isSubmittingComment[post.id] || false,
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{username}</div>
            <div className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</div>
          </div>
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
        {/* Engagement Stats */}
        {(post.likes_count || post.dislikes_count || post.comments_count) && (
          <div className="w-full p-2 border-t flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {post.likes_count && post.likes_count > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {post.likes_count}
                </span>
              )}
              {post.dislikes_count && post.dislikes_count > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsDown className="h-3 w-3" />
                  {post.dislikes_count}
                </span>
              )}
            </div>
            {post.comments_count && post.comments_count > 0 && (
              <span>
                {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
              </span>
            )}
          </div>
        )}

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
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Share className="h-4 w-4" />
              <span>Share</span>
            </Button>
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
      </CardFooter>
    </Card>
  );
}

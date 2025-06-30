import { useState } from 'react';
import { MoreHorizontal, Trash, Send } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  deleteCommentAsync,
  createCommentAsync,
  type PostComment,
} from '@/lib/redux/slices/socialFeedSlice';
import { AppDispatch } from '@/lib/redux/store';
import { formatTimeAgo } from '@/utils/time/formatTimeAgo';

export default function CommentItem({
  comment,
  postId,
  currentUserAddress,
}: {
  comment: PostComment;
  postId: string;
  currentUserAddress: string;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleDeleteComment = async () => {
    if (comment.address.toLowerCase() === currentUserAddress.toLowerCase()) {
      try {
        await dispatch(
          deleteCommentAsync({
            commentId: comment.id,
            address: currentUserAddress,
            postId,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to delete comment:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete comment. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleReply = async () => {
    if (replyText.trim()) {
      try {
        await dispatch(
          createCommentAsync({
            postId,
            address: currentUserAddress,
            commentData: {
              content: replyText.trim(),
              parent_comment_id: comment.id,
            },
          }),
        ).unwrap();
        setReplyText('');
        setIsReplying(false);
      } catch (error) {
        console.error('Failed to post reply:', error);
        toast({
          title: 'Error',
          description: 'Failed to post reply. Please try again.',
          variant: 'destructive',
        });
      }
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
              {comment.profile?.username || comment.address || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.address &&
              comment.address.toLowerCase() === currentUserAddress.toLowerCase() && (
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

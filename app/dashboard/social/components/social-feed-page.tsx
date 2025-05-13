'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchSocialFeed,
  refreshSocialFeed,
  toggleLike,
  addPost,
  clearError,
} from '@/lib/redux/slices/socialFeedSlice';
import { ShareAchievementModal } from './share-achievement-modal';
import { SocialFeedCard } from './social-feed-card';
import { SocialFeedSkeleton } from './social-feed-skeleton';

export function SocialFeedPage() {
  const dispatch = useAppDispatch();
  const { posts, isLoading, error, isRefreshing } = useAppSelector((state) => state.socialFeed);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSocialFeed());
  }, [dispatch]);

  const handleRefresh = async () => {
    await dispatch(refreshSocialFeed()).unwrap();
  };

  const handleLike = (postId: string) => {
    dispatch(toggleLike(postId));
  };

  const handleShare = (content: string, image?: string) => {
    dispatch(
      addPost({
        user: {
          name: 'You',
          username: 'username',
          avatar: '/vibrant-street-market.png',
        },
        content,
        image,
      }),
    );
    setIsShareModalOpen(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Social Feed</h1>
        <RefreshButton onRefresh={handleRefresh} isLoading={isRefreshing} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => dispatch(clearError())}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <Button
          onClick={() => setIsShareModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-6"
        >
          <Plus size={18} />
          Share an Achievement
        </Button>
      </div>

      {isLoading ? (
        <SocialFeedSkeleton />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <SocialFeedCard key={post.id} post={post} onLike={() => handleLike(post.id)} />
          ))}
        </div>
      )}

      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShare}
      />
    </div>
  );
}

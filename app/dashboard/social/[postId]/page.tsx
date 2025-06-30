'use client';

import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchSocialPost } from '@/lib/redux/slices/socialFeedSlice';
import type { AppDispatch, RootState } from '@/lib/redux/store';
import { SocialFeedCard } from '../components/social-feed-card';

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { address } = useAccount();
  const postId = params.postId as string;

  // Use separate selectors to avoid creating new objects on each render
  const currentPost = useSelector((state: RootState) => state.socialFeed.currentPost);
  const isLoadingPost = useSelector((state: RootState) => state.socialFeed.isLoadingPost);
  const error = useSelector((state: RootState) => state.socialFeed.error);

  useEffect(() => {
    if (postId) {
      dispatch(fetchSocialPost({ postId, address }));
    }
  }, [dispatch, postId, address]);

  const handleGoBack = () => {
    router.back();
  };

  if (isLoadingPost) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleGoBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full rounded-md" />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleGoBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="p-6 text-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Post Not Found</h2>
            <p className="text-muted-foreground">
              {error === 'Post not found.'
                ? 'This post may have been deleted or is no longer available.'
                : error}
            </p>
            <Button onClick={() => router.push('/dashboard/social')}>Go to Social Feed</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleGoBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="p-6 text-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Post Not Found</h2>
            <p className="text-muted-foreground">
              This post may have been deleted or is no longer available.
            </p>
            <Button onClick={() => router.push('/dashboard/social')}>Go to Social Feed</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="space-y-6">
        <SocialFeedCard post={currentPost} />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { AlertCircle, Plus, Search, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchSocialFeed,
  refreshSocialFeed,
  createPost,
  fetchConnections,
  searchUsersAsync,
  clearError,
  clearSearchResults,
} from '@/lib/redux/slices/socialFeedSlice';
import { ConnectionsTab } from './connections-tab';
import { ShareAchievementModal } from './share-achievement-modal';
import { SocialFeedCard } from './social-feed-card';
import { SocialFeedSkeleton } from './social-feed-skeleton';
import { UserSearchResults } from './user-search-results';

export function SocialFeedPage() {
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const { posts, connections, searchResults, isLoading, error, isRefreshing, isSearching } =
    useAppSelector((state) => state.socialFeed);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    if (address) {
      dispatch(fetchSocialFeed(address.toLowerCase()));
      dispatch(fetchConnections(address.toLowerCase()));
    }
  }, [dispatch, address]);

  useEffect(() => {
    if (activeTab !== 'search') {
      dispatch(clearSearchResults());
      setSearchTerm('');
    }
  }, [activeTab, dispatch]);

  const handleRefresh = async () => {
    if (address) {
      await dispatch(refreshSocialFeed(address.toLowerCase())).unwrap();
    }
  };

  const handleShare = async (content: string, image?: string) => {
    if (address) {
      try {
        await dispatch(
          createPost({
            address: address.toLowerCase(),
            postData: {
              content,
              image_url: image,
            },
          }),
        ).unwrap();
        setIsShareModalOpen(false);
      } catch (error) {
        console.error('Failed to create post:', error);
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() && address) {
      dispatch(
        searchUsersAsync({
          currentUserAddress: address.toLowerCase(),
          searchTerm: value.trim(),
        }),
      );
    } else {
      dispatch(clearSearchResults());
    }
  };

  if (!address) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Please connect your wallet to view the social feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Social</h1>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="connections">
            <Users className="w-4 h-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Find People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
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
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No posts to show. Your feed displays posts from you and your confirmed
                    connections.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Connect with other users to see their achievements in your feed!
                  </p>
                </div>
              ) : (
                posts.map((post) => <SocialFeedCard key={post.id} post={post} />)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <ConnectionsTab
            connections={connections}
            userAddress={address.toLowerCase()}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="mb-4">
            <Input
              placeholder="Search for users by username..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <UserSearchResults
            searchResults={searchResults}
            isSearching={isSearching}
            currentUserAddress={address.toLowerCase()}
          />
        </TabsContent>
      </Tabs>

      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShare}
        userAddress={address.toLowerCase()}
      />
    </div>
  );
}

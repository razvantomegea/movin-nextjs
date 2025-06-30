'use client';

import { useState } from 'react';
import { UserPlus, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch } from '@/lib/redux/hooks';
import {
  sendConnectionRequestAsync,
  removeConnectionAsync,
  updateSearchResultConnectionStatus,
  type ConnectionUser,
} from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';

interface UserSearchResultsProps {
  searchResults: ConnectionUser[];
  isSearching: boolean;
  currentUserAddress: string;
}

export function UserSearchResults({
  searchResults,
  isSearching,
  currentUserAddress,
}: UserSearchResultsProps) {
  const dispatch = useAppDispatch();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const handleSendConnectionRequest = async (addresseeAddress: string) => {
    setLoadingUser(addresseeAddress);
    // Optimistically update UI
    dispatch(
      updateSearchResultConnectionStatus({
        address: addresseeAddress,
        status: 'pending',
      }),
    );
    try {
      await dispatch(
        sendConnectionRequestAsync({
          requesterAddress: currentUserAddress,
          addresseeAddress,
        }),
      ).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Request Sent',
          description: 'Connection request sent successfully.',
        }),
      );
    } catch (error) {
      // Rollback optimistic update
      dispatch(
        updateSearchResultConnectionStatus({
          address: addresseeAddress,
          status: 'declined',
        }),
      );
      dispatch(
        showInfoToast({
          title: 'Error',
          description: 'Failed to send connection request.',
        }),
      );
    } finally {
      setLoadingUser(null);
    }
  };

  const handleCancelConnectionRequest = async (user: ConnectionUser) => {
    if (!user.connection_id) return;
    setLoadingUser(user.address);
    // Optimistically update UI
    dispatch(
      updateSearchResultConnectionStatus({
        address: user.address,
        status: 'declined',
        connectionId: undefined,
      }),
    );
    try {
      await dispatch(
        removeConnectionAsync({
          connectionId: user.connection_id,
          userAddress: currentUserAddress,
        }),
      ).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Request Cancelled',
          description: 'Connection request cancelled.',
        }),
      );
    } catch (error) {
      // Rollback optimistic update
      dispatch(
        updateSearchResultConnectionStatus({
          address: user.address,
          status: 'pending',
          connectionId: user.connection_id,
        }),
      );
      dispatch(
        showInfoToast({
          title: 'Error',
          description: 'Failed to cancel connection request.',
        }),
      );
    } finally {
      setLoadingUser(null);
    }
  };

  const getConnectionButton = (user: ConnectionUser) => {
    if (user.address === currentUserAddress) {
      return (
        <Button size="sm" variant="outline" disabled>
          You
        </Button>
      );
    }

    switch (user.connection_status) {
      case 'accepted':
        return (
          <Button size="sm" variant="outline" disabled>
            Connected
          </Button>
        );
      case 'pending': {
        // If current user is the requester, show Cancel
        // We don't have direct info here, but in search results, the user is always the addressee except for sent requests
        // So, if connection_id exists and user.connection_status is pending, allow cancel
        // (Assume if connection_id exists, we can cancel)
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled>
              Pending
            </Button>
            {user.connection_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancelConnectionRequest(user)}
                disabled={loadingUser === user.address}
              >
                {loadingUser === user.address ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
          </div>
        );
      }
      case 'declined':
      case 'blocked':
      default:
        return (
          <Button
            size="sm"
            onClick={() => handleSendConnectionRequest(user.address)}
            disabled={loadingUser === user.address}
          >
            {loadingUser === user.address ? (
              'Connecting...'
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                Connect
              </>
            )}
          </Button>
        );
    }
  };

  if (isSearching) {
    return (
      <div className="space-y-3">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No users found. Try searching with a different username.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {searchResults.map((user) => (
        <Card key={user.address}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar_url || '/placeholder.svg'} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate max-w-[160px]">{user.username}</div>
                <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {user.address.slice(0, 6)}...{user.address.slice(-4)}
                </div>
              </div>
              {getConnectionButton(user)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

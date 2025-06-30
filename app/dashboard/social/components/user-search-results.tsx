'use client';

import { UserPlus, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch } from '@/lib/redux/hooks';
import {
  sendConnectionRequestAsync,
  type ConnectionUser,
} from '@/lib/redux/slices/socialFeedSlice';

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

  const handleSendConnectionRequest = async (addresseeAddress: string) => {
    try {
      await dispatch(
        sendConnectionRequestAsync({
          requesterAddress: currentUserAddress,
          addresseeAddress,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Failed to send connection request:', error);
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
      case 'connected':
        return (
          <Button size="sm" variant="outline" disabled>
            Connected
          </Button>
        );
      case 'pending':
        return (
          <Button size="sm" variant="outline" disabled>
            Pending
          </Button>
        );
      case 'sent':
        return (
          <Button size="sm" variant="outline" disabled>
            Request Sent
          </Button>
        );
      default:
        return (
          <Button size="sm" onClick={() => handleSendConnectionRequest(user.address)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Connect
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
              <div className="flex-1">
                <div className="font-medium">{user.username}</div>
                <div className="text-sm text-muted-foreground">
                  {user.address.slice(0, 10)}...{user.address.slice(-8)}
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

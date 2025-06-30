'use client';

import { useEffect } from 'react';
import { UserCheck, UserMinus, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchPendingConnections,
  acceptConnectionRequestAsync,
  declineConnectionRequestAsync,
  removeConnectionAsync,
  type ConnectionUser,
} from '@/lib/redux/slices/socialFeedSlice';

interface ConnectionsTabProps {
  connections: ConnectionUser[];
  userAddress: string;
  isLoading: boolean;
}

export function ConnectionsTab({ connections, userAddress, isLoading }: ConnectionsTabProps) {
  const dispatch = useAppDispatch();
  const { pendingConnections } = useAppSelector((state) => state.socialFeed);

  useEffect(() => {
    dispatch(fetchPendingConnections(userAddress));
  }, [dispatch, userAddress]);

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await dispatch(
        acceptConnectionRequestAsync({
          connectionId,
          addresseeAddress: userAddress,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Failed to accept connection:', error);
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    try {
      await dispatch(
        declineConnectionRequestAsync({
          connectionId,
          addresseeAddress: userAddress,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Failed to decline connection:', error);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (confirm('Are you sure you want to remove this connection?')) {
      try {
        await dispatch(
          removeConnectionAsync({
            connectionId,
            userAddress,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to remove connection:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
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

  return (
    <div className="space-y-6">
      {/* Pending Connection Requests */}
      {pendingConnections.received.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Connection Requests</h3>
          <div className="space-y-3">
            {pendingConnections.received.map((connection) => {
              const profile = connection.requester_profile;
              return (
                <Card key={connection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url || '/placeholder.svg'} />
                        <AvatarFallback>
                          {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{profile?.username || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">
                          Wants to connect with you
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptConnection(connection.id)}>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineConnection(connection.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Connections */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Connections ({connections.length})</h3>

        {connections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No connections yet. Search for people to connect with!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <Card key={connection.address}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={connection.avatar_url || '/placeholder.svg'} />
                      <AvatarFallback>{connection.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{connection.username}</div>
                      <div className="text-sm text-muted-foreground">Connected</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          connection.connection_id &&
                          handleRemoveConnection(connection.connection_id)
                        }
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      {pendingConnections.sent.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
          <div className="space-y-3">
            {pendingConnections.sent.map((connection) => {
              const profile = connection.addressee_profile;
              return (
                <Card key={connection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url || '/placeholder.svg'} />
                        <AvatarFallback>
                          {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{profile?.username || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">Request pending</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveConnection(connection.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

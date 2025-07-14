'use client';

import { useEffect, useState } from 'react';
import { UserCheck, UserMinus, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchPendingConnections,
  acceptConnectionRequestAsync,
  declineConnectionRequestAsync,
  removeConnectionAsync,
  type ConnectionUser,
} from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';

interface ConnectionsTabProps {
  connections: ConnectionUser[];
  userAddress: string;
  isLoading: boolean;
}

export function ConnectionsTab({ connections, userAddress, isLoading }: ConnectionsTabProps) {
  const dispatch = useAppDispatch();
  const { pendingConnections } = useAppSelector((state) => state.socialFeed);
  const router = useRouter();

  // State for confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [connectionToRemove, setConnectionToRemove] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

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

  // Open dialog for remove/cancel
  const openRemoveDialog = (connectionId: string, label: string) => {
    setConnectionToRemove({ id: connectionId, label });
    setConfirmDialogOpen(true);
  };

  // Confirm removal
  const handleRemoveConnection = async () => {
    if (!connectionToRemove) return;
    setIsRemoving(true);
    try {
      await dispatch(
        removeConnectionAsync({
          connectionId: connectionToRemove.id,
          userAddress,
        }),
      ).unwrap();
      setConfirmDialogOpen(false);
      setConnectionToRemove(null);
      dispatch(
        showSuccessToast({
          title:
            connectionToRemove.label === 'Cancel Request'
              ? 'Request Cancelled'
              : 'Connection Removed',
          description:
            connectionToRemove.label === 'Cancel Request'
              ? 'Connection request cancelled.'
              : 'Connection removed.',
        }),
      );
    } catch (error) {
      console.error('Failed to remove connection:', error);
      dispatch(
        showInfoToast({
          title: 'Error',
          description:
            connectionToRemove.label === 'Cancel Request'
              ? 'Failed to cancel connection request.'
              : 'Failed to remove connection.',
        }),
      );
    } finally {
      setIsRemoving(false);
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
    <>
      <div className="space-y-6">
        {/* Pending Connection Requests */}
        {pendingConnections.received.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Connection Requests</h3>
            <div className="space-y-3">
              {pendingConnections.received.map((connection) => {
                const profile = connection.requester_profile;
                const handleProfileClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (connection.requester_address) {
                    router.push(`/dashboard/profile?address=${connection.requester_address}`);
                  }
                };
                return (
                  <Card key={connection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleProfileClick}
                          className="focus:outline-none group"
                          aria-label={`View ${profile?.username || 'user'}'s profile`}
                          tabIndex={0}
                          style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
                        >
                          <Avatar className="transition-transform group-hover:scale-105">
                            <AvatarImage src={profile?.avatar_url || '/placeholder.svg'} />
                            <AvatarFallback>
                              {profile?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                        <button
                          type="button"
                          onClick={handleProfileClick}
                          className="font-medium truncate max-w-[160px] text-left bg-transparent border-none p-0 m-0 hover:underline"
                          aria-label={`View ${profile?.username || 'user'}'s profile`}
                          tabIndex={0}
                        >
                          {profile?.username || 'Unknown User'}
                        </button>
                        <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                          Wants to connect with you
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
              {connections.map((connection) => {
                const handleProfileClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (connection.address) {
                    router.push(`/dashboard/profile?address=${connection.address}`);
                  }
                };
                return (
                  <Card key={connection.address}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleProfileClick}
                          className="focus:outline-none group"
                          aria-label={`View ${connection.username}'s profile`}
                          tabIndex={0}
                          style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
                        >
                          <Avatar className="transition-transform group-hover:scale-105">
                            <AvatarImage src={connection.avatar_url || '/placeholder.svg'} />
                            <AvatarFallback>
                              {connection.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                        <button
                          type="button"
                          onClick={handleProfileClick}
                          className="font-medium truncate max-w-[160px] text-left bg-transparent border-none p-0 m-0 hover:underline"
                          aria-label={`View ${connection.username}'s profile`}
                          tabIndex={0}
                        >
                          {connection.username}
                        </button>
                        {connection.address && (
                          <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {connection.address.slice(0, 6)}...{connection.address.slice(-4)}
                          </div>
                        )}
                        {!connection.address && (
                          <div className="text-sm text-muted-foreground">Connected</div>
                        )}
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
                            openRemoveDialog(connection.connection_id, 'Remove Connection')
                          }
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate max-w-[160px]">
                            {profile?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                            Request pending
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRemoveDialog(connection.id, 'Cancel Request')}
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

      {/* Confirmation Dialog for Remove/Cancel */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{connectionToRemove?.label || 'Remove Connection'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {connectionToRemove?.label === 'Cancel Request'
                ? 'Are you sure you want to cancel this connection request?'
                : 'Are you sure you want to remove this connection?'}{' '}
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveConnection} disabled={isRemoving}>
              {(() => {
                const isCancelRequest = connectionToRemove?.label === 'Cancel Request';
                if (isRemoving) {
                  return isCancelRequest ? 'Cancelling...' : 'Removing...';
                }
                return isCancelRequest ? 'Cancel Request' : 'Remove';
              })()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

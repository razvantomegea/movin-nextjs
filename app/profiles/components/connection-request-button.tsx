'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '@/lib/supabase/connections';
import { getClient } from '@/lib/supabase/createClient';

interface ConnectionRequestButtonProps {
  targetAddress: string;
  connectionStatus?: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  connectionId?: string;
  onConnectionUpdate: () => void;
}

export function ConnectionRequestButton({
  targetAddress,
  connectionStatus = 'none',
  connectionId,
  onConnectionUpdate,
}: ConnectionRequestButtonProps) {
  const { address: userAddress } = useAppKitAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendRequest = async () => {
    if (!userAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      const client = getClient();
      await sendConnectionRequest({
        requesterAddress: userAddress.toLowerCase(),
        addresseeAddress: targetAddress,
        client,
      });

      onConnectionUpdate();
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError(err instanceof Error ? err.message : 'Failed to send connection request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!userAddress || !connectionId) return;

    try {
      setIsLoading(true);
      setError(null);

      const client = getClient();
      await acceptConnectionRequest({
        connectionId,
        addresseeAddress: userAddress.toLowerCase(),
        client,
      });

      onConnectionUpdate();
    } catch (err) {
      console.error('Error accepting connection request:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept connection request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!userAddress || !connectionId) return;

    try {
      setIsLoading(true);
      setError(null);

      const client = getClient();
      await declineConnectionRequest({
        connectionId,
        addresseeAddress: userAddress.toLowerCase(),
        client,
      });

      onConnectionUpdate();
    } catch (err) {
      console.error('Error declining connection request:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline connection request');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    switch (connectionStatus) {
      case 'none':
        return {
          text: 'Send Connection Request',
          action: handleSendRequest,
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
          disabled: false,
        };
      case 'pending':
        // Check if current user is the requester or addressee
        return {
          text: 'Request Pending',
          action: () => {},
          className: 'bg-gray-300 text-gray-600 cursor-not-allowed',
          disabled: true,
        };
      case 'accepted':
        return {
          text: 'Connected',
          action: () => {},
          className: 'bg-green-500 text-white cursor-not-allowed',
          disabled: true,
        };
      case 'declined':
        return {
          text: 'Request Declined',
          action: () => {},
          className: 'bg-red-300 text-red-700 cursor-not-allowed',
          disabled: true,
        };
      case 'blocked':
        return {
          text: 'Blocked',
          action: () => {},
          className: 'bg-red-500 text-white cursor-not-allowed',
          disabled: true,
        };
      default:
        return {
          text: 'Send Connection Request',
          action: handleSendRequest,
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
          disabled: false,
        };
    }
  };

  const buttonConfig = getButtonContent();

  if (!userAddress) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Connect your wallet to send connection requests.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="text-center space-y-4">
        <div>
          {connectionStatus === 'none' && (
            <>
              <h3 className="text-lg font-semibold mb-2">Connect to View Full Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This user has a partially public profile. Send a connection request to see their
                full information.
              </p>
            </>
          )}
          {connectionStatus === 'pending' && (
            <>
              <h3 className="text-lg font-semibold mb-2">Connection Request Pending</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your connection request is pending. Please wait for the user to accept.
              </p>
            </>
          )}
          {connectionStatus === 'accepted' && (
            <>
              <h3 className="text-lg font-semibold mb-2">Connected</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are connected. You can now view the full profile information.
              </p>
            </>
          )}
          {connectionStatus === 'declined' && (
            <>
              <h3 className="text-lg font-semibold mb-2">Connection Request Declined</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your connection request was declined.
              </p>
            </>
          )}
          {connectionStatus === 'blocked' && (
            <>
              <h3 className="text-lg font-semibold mb-2">Blocked</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are blocked from viewing this profile.
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Show Connect button only if not connected and not pending */}
          {connectionStatus === 'none' && (
            <button
              onClick={buttonConfig.action}
              disabled={buttonConfig.disabled || isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                buttonConfig.className
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : 'Connect'}
            </button>
          )}

          {/* Show Accept/Decline if pending and connectionId exists */}
          {connectionStatus === 'pending' && connectionId && (
            <>
              <button
                onClick={handleAcceptRequest}
                disabled={isLoading}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept
              </button>
              <button
                onClick={handleDeclineRequest}
                disabled={isLoading}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
            </>
          )}

          {/* Show Disconnect if connected */}
          {connectionStatus === 'accepted' && (
            <button
              // TODO: Implement disconnect logic
              onClick={() => {}}
              disabled={isLoading}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

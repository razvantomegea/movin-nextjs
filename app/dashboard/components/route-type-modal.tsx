'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, MapPin, Search, UserPlus, Check, Clock } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  findNearbyUsers,
  inviteUser,
  setJointTracking,
  simulateAcceptInvitation,
} from '@/lib/redux/slices/jointTrackingSlice';
import { showInfoToast } from '@/lib/redux/slices/toastSlice';

interface RouteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectJoint: () => void;
}

export function RouteTypeModal({
  isOpen,
  onClose,
  onSelectSingle,
  onSelectJoint,
}: RouteTypeModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<'select' | 'search' | 'invite'>('select');

  const { nearbyUsers, invitedUsers, joinedUsers, isSearching, error } = useAppSelector(
    (state) => state.jointTracking,
  );

  // Handle searching for nearby users
  const handleSearchNearby = () => {
    setStep('search');
    // In a real app, we would get the user's current location
    // For now, we'll use a hardcoded location
    const userLocation = { lat: 37.7749, lng: -122.4194 };
    dispatch(findNearbyUsers(userLocation));
  };

  // Handle inviting a user
  const handleInviteUser = (userId: string) => {
    dispatch(inviteUser(userId));

    // Simulate the user accepting after a delay (for demo purposes)
    setTimeout(() => {
      dispatch(simulateAcceptInvitation(userId));
      dispatch(
        showInfoToast({
          title: 'Invitation Accepted',
          description: 'A user has accepted your invitation to join the route tracking.',
        }),
      );
    }, 2000 + Math.random() * 2000); // Random delay between 2-4 seconds
  };

  // Handle starting joint tracking
  const handleStartJointTracking = () => {
    dispatch(setJointTracking(true));
    onSelectJoint();
  };

  // Render the selection step
  const renderSelectionStep = () => (
    <div className="p-6 space-y-6">
      <h3 className="text-xl font-semibold text-center mb-4">Choose Tracking Mode</h3>

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={onSelectSingle}
          variant="outline"
          className={`h-auto py-6 flex flex-col items-center justify-center space-y-3 ${
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          }`}
        >
          <User className="h-10 w-10 text-blue-500" />
          <div className="text-center">
            <div className="font-medium">Single</div>
            <p className="text-xs text-gray-500 mt-1">Track your route individually</p>
          </div>
        </Button>

        <Button
          variant="outline"
          disabled
          className={`h-auto py-6 flex flex-col items-center justify-center space-y-3 opacity-70 ${
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          }`}
        >
          <Users className="h-10 w-10 text-green-500" />
          <div className="text-center">
            <div className="font-medium">Joint</div>
            <p className="text-xs text-gray-500 mt-1">Track with friends nearby</p>
            <p className="text-xs font-medium text-amber-500 mt-1">Coming Soon</p>
          </div>
        </Button>
      </div>
    </div>
  );

  // Render the search step
  const renderSearchStep = () => (
    <div className="p-6 space-y-4">
      <h3 className="text-xl font-semibold text-center mb-2">Find Nearby Users</h3>

      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Search className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
          <p className="text-gray-500">Searching for nearby users...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleSearchNearby}>Try Again</Button>
        </div>
      ) : nearbyUsers.length === 0 ? (
        <div className="text-center py-6">
          <Users className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No users found nearby</p>
          <Button onClick={handleSearchNearby}>Search Again</Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 text-center mb-2">
            Found {nearbyUsers.length} users nearby. Invite them to join your route tracking.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {nearbyUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={user.avatar || '/placeholder.svg'} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">Within 10m of you</p>
                  </div>
                </div>

                {joinedUsers.includes(user.id) ? (
                  <Button size="sm" variant="ghost" className="text-green-500" disabled>
                    <Check className="h-4 w-4 mr-1" />
                    Joined
                  </Button>
                ) : invitedUsers.includes(user.id) ? (
                  <Button size="sm" variant="ghost" className="text-amber-500" disabled>
                    <Clock className="h-4 w-4 mr-1" />
                    Invited
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleInviteUser(user.id)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep('select')}>
              Back
            </Button>
            <Button
              onClick={handleStartJointTracking}
              className="bg-green-500 hover:bg-green-600"
              disabled={joinedUsers.length === 0}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Start Joint Tracking ({joinedUsers.length})
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`relative w-full max-w-md rounded-xl overflow-hidden ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <h2 className="text-xl font-bold">Route Tracking</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            {step === 'select' ? renderSelectionStep() : renderSearchStep()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

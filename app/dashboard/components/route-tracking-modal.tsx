'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Save, RotateCw, MapPin, AlertTriangle, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useGoogleMapsStatus } from '@/app/contexts/google-maps-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatDistance, formatDuration } from '@/utils';

interface RouteTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoute: (routeData: RouteData) => void;
  isJointTracking?: boolean;
}

export interface RouteData {
  id: string;
  distance: number; // in meters
  duration: number; // in seconds
  startTime: Date;
  endTime: Date;
  path: google.maps.LatLngLiteral[];
  averageSpeed: number; // in m/s
  isJoint: boolean;
  participants?: { id: string; username: string; avatar: string }[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Simulated user data for Sarrah
const sarrahUser = {
  id: 'sarrah-123',
  username: 'Sarrah',
  avatar: '/serene-woman-gaze.png', // Using an existing image from the project
  location: { lat: 0, lng: 0 }, // Will be updated based on current position
};

// Haversine formula to calculate distance between two coordinates
const calculateHaversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export function RouteTrackingModal({
  isOpen,
  onClose,
  onSaveRoute,
  isJointTracking = false,
}: RouteTrackingModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mapRef = useRef<google.maps.Map | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const { isLoaded: mapsLoaded, loadError: mapsError } = useGoogleMapsStatus();

  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [distance, setDistance] = useState(0); // in meters
  const [duration, setDuration] = useState(0); // in seconds
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<
    'prompt' | 'granted' | 'denied' | 'unknown'
  >('unknown');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Simulated joint tracking state
  const [sarrahPosition, setSarrahPosition] = useState<google.maps.LatLngLiteral | null>(null);

  // Initialize permission check
  useEffect(() => {
    if (!isOpen) return;

    // Handle permission using the Permissions API
    const handlePermission = () => {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      // Check if Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((result) => {
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied');

            // Handle initial state
            if (result.state === 'granted') {
              // Permission already granted, get position
              getCurrentPosition();
            } else if (result.state === 'prompt') {
              // Will prompt when we request position
              setPermissionState('prompt');
            } else if (result.state === 'denied') {
              // Permission denied, show UI to help user enable it
              setPermissionState('denied');
            }

            // Listen for changes to permission state
            result.addEventListener('change', () => {
              console.log('Permission state changed to:', result.state);
              setPermissionState(result.state as 'prompt' | 'granted' | 'denied');

              if (result.state === 'granted') {
                getCurrentPosition();
              }
            });
          })
          .catch((error) => {
            console.error('Error checking permission:', error);
            // If we can't check permissions, assume we need to prompt
            setPermissionState('prompt');
          });
      } else {
        // Permissions API not available, assume we need to prompt
        setPermissionState('prompt');
        console.log('Permissions API not available, assuming prompt state');
      }
    };

    handlePermission();

    return () => {
      // Clean up tracking when modal closes
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOpen]);

  // Update Sarrah's position when current position changes
  useEffect(() => {
    if (currentPosition) {
      // Place Sarrah slightly offset from the user's position
      setSarrahPosition({
        lat: currentPosition.lat + 0.0005, // About 50 meters north
        lng: currentPosition.lng - 0.0003, // Slightly west
      });

      // Update Sarrah's location in the user object
      sarrahUser.location = {
        lat: currentPosition.lat + 0.0005,
        lng: currentPosition.lng - 0.0003,
      };
    }
  }, [currentPosition]);

  // Request permission and get position
  const requestLocationPermission = () => {
    console.log('Requesting location permission...');

    // This will trigger the permission prompt if state is "prompt"
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Permission granted, position obtained:', position.coords);
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(currentPos);
        setPermissionState('granted');
        setError(null);
      },
      (err) => {
        console.error('Error getting position:', err);

        // Update permission state if denied
        if (err.code === 1) {
          // PERMISSION_DENIED
          setPermissionState('denied');
          setError(
            'Location access was denied. Please enable location permissions in your browser settings.',
          );
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          setError('Your location is currently unavailable. Please try again later.');
        } else if (err.code === 3) {
          // TIMEOUT
          setError('Location request timed out. Please try again.');
        } else {
          setError('Could not access your location. Please check permissions and try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // Get current position (when permission is already granted)
  const getCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(currentPos);
        setError(null);
      },
      (err) => {
        console.error('Error getting current position:', err);

        // Handle specific error codes
        if (err.code === 1) {
          // PERMISSION_DENIED
          setPermissionState('denied');
          setError(
            'Location access was denied. Please enable location permissions in your browser settings.',
          );
        } else {
          setError('Could not access your location. Please check permissions and try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Update timer when tracking
  useEffect(() => {
    if (!isTracking || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // Start tracking
  const startTracking = () => {
    if (permissionState !== 'granted') {
      requestLocationPermission();
      return;
    }

    setIsTracking(true);
    setStartTime(new Date());
    setDuration(0);
    setDistance(0);
    setRoutePath([]);

    if (currentPosition) {
      setRoutePath([currentPosition]);
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        console.log('New position update:', newPos);
        setCurrentPosition(newPos);

        // Update route path
        setRoutePath((prevPath) => {
          const newPath = [...prevPath, newPos];

          // Calculate new distance
          if (prevPath.length > 0) {
            const lastPos = prevPath[prevPath.length - 1];
            let segmentDistance = 0;

            // Try using Google Maps geometry library if available
            if (window.google?.maps?.geometry) {
              segmentDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
                new window.google.maps.LatLng(lastPos.lat, lastPos.lng),
                new window.google.maps.LatLng(newPos.lat, newPos.lng),
              );
            } else {
              // Fallback to Haversine formula if Google Maps geometry isn't available
              segmentDistance = calculateHaversineDistance(
                lastPos.lat,
                lastPos.lng,
                newPos.lat,
                newPos.lng,
              );
            }

            setDistance((prevDistance) => prevDistance + segmentDistance);
          }

          return newPath;
        });
      },
      (err) => {
        console.error('Error tracking position:', err);

        if (err.code === 1) {
          // PERMISSION_DENIED
          setPermissionState('denied');
          setError(
            'Location access was denied. Please enable location permissions in your browser settings.',
          );
        } else {
          setError('Error tracking your location. Please try again.');
        }

        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
    );
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // Save route
  const saveRoute = () => {
    if (!startTime || routePath.length < 2) return;

    const endTime = new Date();
    const routeDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const averageSpeed = routeDuration > 0 ? distance / routeDuration : 0;

    const routeData: RouteData = {
      id: Date.now().toString(),
      distance,
      duration: routeDuration,
      startTime,
      endTime,
      path: routePath,
      averageSpeed,
      isJoint: isJointTracking,
      participants: isJointTracking
        ? [
            {
              id: sarrahUser.id,
              username: sarrahUser.username,
              avatar: sarrahUser.avatar,
            },
          ]
        : undefined,
    };

    onSaveRoute(routeData);
    onClose();
  };

  // Reset tracking
  const resetTracking = () => {
    stopTracking();
    setRoutePath([]);
    setDistance(0);
    setDuration(0);
    setStartTime(null);
  };

  // Map load handler
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;

    // If we already have a position, center the map on it
    if (currentPosition) {
      map.setCenter(currentPosition);
      map.setZoom(16);
    }
  };

  // Render permission request UI
  const renderPermissionRequest = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="h-16 w-16 text-blue-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Location Access Required</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          To track your route, we need permission to access your location. Your location data is
          only used while the app is open.
        </p>
        <Button onClick={requestLocationPermission} className="bg-blue-500 hover:bg-blue-600">
          Allow Location Access
        </Button>
      </div>
    );
  };

  // Render permission denied UI
  const renderPermissionDenied = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Location Access Denied</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You&apos;ve denied access to your location. To track your route, please enable location
          permissions in your browser settings and try again.
        </p>
        <div className="space-y-4">
          <Button onClick={requestLocationPermission} className="bg-blue-500 hover:bg-blue-600">
            Try Again
          </Button>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            <p className="font-medium mb-2">How to enable location:</p>
            <ul className="text-left list-disc pl-5 space-y-1">
              <li>
                Chrome: Click the lock icon in the address bar → Site settings → Allow location
              </li>
              <li>Firefox: Click the shield icon → Site permissions → Location → Allow</li>
              <li>Safari: Preferences → Websites → Location → Allow</li>
              <li>Mobile: Check your device settings for location permissions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Render loading UI
  const renderLoading = () => {
    if (error) {
      return null;
    }

    return (
      <div className="flex align-middle flex-col items-center justify-center text-center">
        <RotateCw className="h-16 w-16 text-blue-500 animate-spin mb-4" />
        <h3 className="text-xl font-bold mb-2">Loading Map</h3>
        <p className="text-gray-500 dark:text-gray-400">Please wait while we load the map...</p>
      </div>
    );
  };

  // Render maps error UI
  const renderMapsError = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Maps Error</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          There was an error loading Google Maps. Please refresh the page and try again.
        </p>
        <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
          Refresh Page
        </Button>
      </div>
    );
  };

  // Map options
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    styles: isDark
      ? [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        ]
      : [],
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className={`relative w-full h-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-xl overflow-hidden ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <h2 className="text-xl font-bold">
                {isJointTracking ? (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-500" />
                    Joint Route Tracking
                  </div>
                ) : (
                  'Track Route'
                )}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Main Content */}
            <div
              className={cn('flex-1', {
                'flex align-middle h-full pb-32 sm:pb-0':
                  !mapsLoaded ||
                  mapsError ||
                  permissionState === 'prompt' ||
                  permissionState === 'denied',
              })}
            >
              {!mapsLoaded ? (
                renderLoading()
              ) : mapsError ? (
                renderMapsError()
              ) : permissionState === 'prompt' ? (
                renderPermissionRequest()
              ) : permissionState === 'denied' ? (
                renderPermissionDenied()
              ) : (
                <div
                  className={cn('relative w-full bg-gray-200 dark:bg-gray-800 h-[65vh] sm:h-auto', {
                    flex: !currentPosition,
                    'aspect-[4/3]': currentPosition,
                  })}
                >
                  {currentPosition ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={currentPosition}
                      zoom={16}
                      options={mapOptions}
                      onLoad={onMapLoad}
                    >
                      {/* Current user marker */}
                      {currentPosition && (
                        <Marker
                          position={currentPosition}
                          icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                          }}
                        />
                      )}

                      {/* Sarrah's marker */}
                      {isJointTracking && sarrahPosition && (
                        <Marker
                          position={sarrahPosition}
                          onClick={() => setSelectedUser(sarrahUser.id)}
                          icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#10B981', // Green color
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                          }}
                        />
                      )}

                      {/* Info window for Sarrah */}
                      {selectedUser === sarrahUser.id && sarrahPosition && (
                        <InfoWindow
                          position={sarrahPosition}
                          onCloseClick={() => setSelectedUser(null)}
                        >
                          <div className="p-1">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={sarrahUser.avatar || '/placeholder.svg'}
                                  alt={sarrahUser.username}
                                />
                                <AvatarFallback>{sarrahUser.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{sarrahUser.username}</span>
                            </div>
                          </div>
                        </InfoWindow>
                      )}

                      {/* Route path */}
                      {routePath.length > 1 && (
                        <Polyline
                          path={routePath}
                          options={{
                            strokeColor: '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: 3,
                          }}
                        />
                      )}
                    </GoogleMap>
                  ) : (
                    renderLoading()
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center p-4">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                      </div>
                    </div>
                  )}

                  {/* Tracking Stats Overlay */}
                  {!error && currentPosition && (
                    <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-300">Distance</div>
                        <div className="text-white font-bold">{formatDistance(distance)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-300">Duration</div>
                        <div className="text-white font-bold">{formatDuration(duration)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-300">Pace</div>
                        <div className="text-white font-bold">
                          {distance > 0 && duration > 0
                            ? (() => {
                                const secondsPerKm = duration / (distance / 1000);
                                const minutes = Math.floor(secondsPerKm / 60);
                                const seconds = Math.floor(secondsPerKm % 60);
                                return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
                              })()
                            : '--:--'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Participants Overlay (for joint tracking) */}
                  {isJointTracking && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2">
                      <div className="text-xs text-gray-300 mb-1">Participants</div>
                      <div className="flex space-x-2 overflow-x-auto pb-1">
                        <div className="flex-shrink-0">
                          <Avatar className="h-8 w-8 border-2 border-green-500">
                            <AvatarImage
                              src={sarrahUser.avatar || '/placeholder.svg'}
                              alt={sarrahUser.username}
                            />
                            <AvatarFallback>{sarrahUser.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              {permissionState === 'granted' && !error && (
                <div className="p-4 text-center">
                  {!isTracking ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Press start to begin tracking your route
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your route is being tracked. Press pause to stop tracking.
                    </p>
                  )}
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-2">
                    For best tracking accuracy and experience, please keep the app open or check it
                    every few minutes.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {permissionState === 'granted' && !error && (
                <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={resetTracking}
                      disabled={isTracking && routePath.length === 0}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>

                    {!isTracking ? (
                      <Button onClick={startTracking} className="bg-green-500 hover:bg-green-600">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <Button onClick={stopTracking} className="bg-amber-500 hover:bg-amber-600">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}

                    <Button
                      onClick={saveRoute}
                      className="bg-blue-500 hover:bg-blue-600"
                      disabled={isTracking || routePath.length < 2}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-only bottom padding for safe area */}
            <div className="h-8 sm:hidden"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

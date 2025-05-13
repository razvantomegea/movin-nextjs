'use client';

import { type ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

// Create a context to store the loading state and error
interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
});

// Define a function component called GoogleMapsProvider that takes a children prop
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);

  // Initialize Google Maps only once after component mounts
  useEffect(() => {
    let isMounted = true;

    const initializeGoogleMaps = async () => {
      try {
        // Initialize the loader
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'drawing', 'geometry'],
        });

        // Load the Google Maps API
        await loader.load();

        if (isMounted) {
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (isMounted) {
          setLoadError(error instanceof Error ? error : new Error('Failed to load Google Maps'));
        }
      }
    };

    initializeGoogleMaps();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array ensures this runs only once

  // Return the children wrapped in the context provider
  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

// Export a hook to check if maps are loaded
export function useGoogleMapsStatus() {
  const context = useContext(GoogleMapsContext);

  if (context === undefined) {
    throw new Error('useGoogleMapsStatus must be used within a GoogleMapsProvider');
  }

  return context;
}

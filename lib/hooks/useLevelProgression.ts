import { useState, useCallback } from 'react';
import { 
  checkAndUpdateLevel,
  getLevelProgressionInfo,
  canUserLevelUp,
  updateGoalProgressAndCheckLevel,
  LevelProgressionResult,
  LevelProgressionInfo
} from '@/lib/supabase/levelProgression';
import { SupabaseClient } from '@supabase/supabase-js';

export interface UseLevelProgressionProps {
  address?: string;
  client?: SupabaseClient;
}

export interface UseLevelProgressionReturn {
  // State
  isLoading: boolean;
  error: string | null;
  lastResult: LevelProgressionResult | null;
  
  // Actions
  checkLevel: () => Promise<LevelProgressionResult>;
  getLevelInfo: () => Promise<LevelProgressionInfo>;
  canLevelUp: () => Promise<{ canLevelUp: boolean; completedCategories: string[]; potentialIncrease: number; }>;
  updateProgressAndCheck: (category?: 'daily' | 'weekly' | 'monthly') => Promise<{ goalUpdateSuccess: boolean; levelResult?: LevelProgressionResult; }>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

/**
 * React hook for managing level progression
 * Provides easy access to level checking and updating functionality
 */
export function useLevelProgression({ 
  address, 
  client 
}: UseLevelProgressionProps = {}): UseLevelProgressionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LevelProgressionResult | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setLastResult(null);
  }, []);

  const checkLevel = useCallback(async (): Promise<LevelProgressionResult> => {
    if (!address) {
      throw new Error('Address is required for level progression');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkAndUpdateLevel({ address, client });
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check level progression';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  const getLevelInfo = useCallback(async (): Promise<LevelProgressionInfo> => {
    if (!address) {
      throw new Error('Address is required for level progression info');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getLevelProgressionInfo({ address, client });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get level progression info';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  const canLevelUp = useCallback(async () => {
    if (!address) {
      throw new Error('Address is required for level progression check');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await canUserLevelUp({ address, client });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check level up eligibility';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  const updateProgressAndCheck = useCallback(async (category: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    if (!address) {
      throw new Error('Address is required for goal progress update');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateGoalProgressAndCheckLevel({ 
        address, 
        category, 
        client 
      });
      
      if (result.levelResult) {
        setLastResult(result.levelResult);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress and check level';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, client]);

  return {
    // State
    isLoading,
    error,
    lastResult,
    
    // Actions
    checkLevel,
    getLevelInfo,
    canLevelUp,
    updateProgressAndCheck,
    
    // Utilities
    clearError,
    reset,
  };
}

/**
 * Hook for simple level checking without state management
 * Use this when you just need to trigger a level check without managing loading states
 */
export function useSimpleLevelCheck(address?: string, client?: SupabaseClient) {
  return useCallback(async (): Promise<LevelProgressionResult> => {
    if (!address) {
      throw new Error('Address is required for level progression');
    }

    return checkAndUpdateLevel({ address, client });
  }, [address, client]);
}
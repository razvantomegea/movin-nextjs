'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, Calendar, Loader2, Edit, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useDispatch, useSelector } from 'react-redux';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  fetchRecentMeals,
  searchMeals,
  clearSearchResults,
  deleteMealFromLibrary, // Import the action
} from '@/lib/redux/slices/mealsSlice';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { IMeal } from '@/lib/supabase/meals';

interface MealSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeal: (meal: IMeal) => void;
  onEditMeal: (meal: IMeal) => void; // New prop for editing
  userAddress: string;
}

export function MealSearchModal({
  isOpen,
  onClose,
  onSelectMeal,
  onEditMeal,
  userAddress,
}: MealSearchModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useDispatch<AppDispatch>();

  const { recentMeals, searchResults, isLoading, error } = useSelector(
    (state: RootState) => state.meals,
  );

  const [activeTab, setActiveTab] = useState<'recent' | 'search'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mealToDeleteId, setMealToDeleteId] = useState<string | null>(null);

  // Fetch recent meals when modal opens
  useEffect(() => {
    // Only fetch if userAddress is present and recentMeals is empty or not yet loaded for this user
    if (isOpen && userAddress && recentMeals.length === 0) {
      dispatch(fetchRecentMeals(userAddress));
    }
  }, [isOpen, userAddress, dispatch, recentMeals.length]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchQuery.trim() && userAddress) {
      const timeoutId = setTimeout(() => {
        dispatch(searchMeals({ address: userAddress, searchTerm: searchQuery.trim() }));
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    } else if (!searchQuery.trim()) {
      // Clear search results if query is empty
      dispatch(clearSearchResults());
    }
  }, [searchQuery, userAddress, dispatch]);

  // Switch to search tab when user starts typing
  useEffect(() => {
    if (searchQuery.trim()) {
      setActiveTab('search');
    }
  }, [searchQuery]);

  const currentMeals = activeTab === 'recent' ? recentMeals : searchResults;

  const formatLastEaten = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleMealSelect = (meal: IMeal) => {
    onSelectMeal(meal); // This is for logging the meal
    onClose();
  };

  const handleEditClick = (meal: IMeal) => {
    onEditMeal(meal); // This will open the MealDetectionResultsModal for editing
    // onClose(); // Keep search modal open or close based on UX preference, for now, it closes.
  };

  const handleRemoveClick = (mealId: string) => {
    setMealToDeleteId(mealId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmRemove = async () => {
    if (mealToDeleteId && userAddress) {
      try {
        await dispatch(
          deleteMealFromLibrary({ mealId: mealToDeleteId, address: userAddress }),
        ).unwrap(); // unwrap to catch potential rejections here
        // No need to manually refetch, the slice reducer should update the lists.
        // Consider adding a success toast if desired.
      } catch (error) {
        console.error('Failed to delete meal:', error);
        // Consider adding an error toast here.
      }
    }
    setShowDeleteConfirm(false);
    setMealToDeleteId(null);
  };

  const handleClose = () => {
    setSearchQuery('');
    dispatch(clearSearchResults());
    setShowDeleteConfirm(false); // Ensure dialog is closed
    setMealToDeleteId(null);
    onClose();
  };

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      dispatch(clearSearchResults());
      setActiveTab('recent'); // Default to recent tab
    }
  }, [isOpen, dispatch]);

  const getEmptyStateMessage = () => {
    if (activeTab === 'search') {
      if (searchQuery.trim()) {
        return isLoading ? 'Searching...' : 'No meals found for your search';
      }
      return 'Start typing to search your meals';
    }
    return 'No recent meals found';
  };

  const getEmptyStateDescription = () => {
    if (activeTab === 'search') {
      if (searchQuery.trim() && !isLoading) {
        return 'Try different keywords or check your spelling';
      }
      return 'Enter meal names to find your previously logged meals';
    }
    return 'Your recently logged meals will appear here';
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
            onClick={handleClose} // Close on backdrop click
          />

          <motion.div
            className={`relative w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl overflow-hidden ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl flex flex-col`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-bold">Search Your Meals</h2>
                <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Input */}
              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search meals by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {isLoading && activeTab === 'search' && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'recent'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : `border-transparent ${
                          isDark
                            ? 'text-gray-400 hover:text-gray-300'
                            : 'text-gray-500 hover:text-gray-700'
                        }`
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Recent</span>
                    {recentMeals.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {recentMeals.length}
                      </Badge>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  disabled={!searchQuery.trim()}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'search'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : `border-transparent ${
                          isDark
                            ? 'text-gray-400 hover:text-gray-300'
                            : 'text-gray-500 hover:text-gray-700'
                        }`
                  } ${!searchQuery.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                    {searchResults.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {searchResults.length}
                      </Badge>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {currentMeals.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Search
                    className={`h-12 w-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                  />
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {getEmptyStateMessage()}
                  </h3>
                  <p
                    className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {getEmptyStateDescription()}
                  </p>
                </div>
              ) : isLoading && currentMeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Loader2
                    className={`h-12 w-12 mb-4 animate-spin ${
                      isDark ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  />
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {isLoading && activeTab === 'recent'
                      ? 'Loading recent meals...'
                      : 'Searching...'}
                  </h3>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {currentMeals.map((meal) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={`transition-colors ${
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700/70 border-gray-700'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 pr-2">
                              <h3
                                className="font-semibold cursor-pointer"
                                onClick={() => handleMealSelect(meal)}
                              >
                                {meal.meal_name}
                              </h3>
                              <div
                                className={`text-xs mt-1 ${
                                  isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}
                              >
                                Logged on {new Date(meal.log_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(meal)}
                                className="h-8 w-8 rounded-full"
                                title="Edit meal"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveClick(meal.id)}
                                className="h-8 w-8 rounded-full text-red-500 hover:text-red-600"
                                title="Remove meal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {activeTab === 'recent' && (
                                <div
                                  className={`flex items-center space-x-1 text-xs pl-2 ${
                                    isDark ? 'text-gray-500' : 'text-gray-400'
                                  }`}
                                >
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatLastEaten(meal.created_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Nutrition Info */}
                          <div
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-2 cursor-pointer"
                            onClick={() => handleMealSelect(meal)}
                          >
                            <Badge variant="secondary">{meal.calories} cal</Badge>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              P: {meal.protein}g
                            </span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              C: {meal.carbohydrates}g
                            </span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              F: {meal.fats}g
                            </span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              Fi: {meal.fiber}g
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile-only bottom padding for safe area */}
            <div className="h-8 sm:hidden"></div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this meal from your
                  library.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmRemove}
                  className={buttonVariants({ variant: 'destructive' })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

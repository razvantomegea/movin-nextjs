'use client';

import { motion } from 'framer-motion';
import { Calendar, Utensils, Zap, Activity, Apple } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IEnergy } from '@/lib/supabase/energy';
import { IProfile } from '@/lib/supabase/profile';

interface MealsTabProps {
  profile: IProfile;
  energyEntries: IEnergy[];
  isReadOnly: boolean;
}

export function MealsTab({ profile, energyEntries, isReadOnly }: MealsTabProps) {
  const sortedEntries = [...energyEntries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const totalCalories = energyEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = energyEntries.reduce((sum, entry) => sum + entry.protein, 0);
  const totalCarbs = energyEntries.reduce((sum, entry) => sum + entry.carbohydrates, 0);
  const totalFats = energyEntries.reduce((sum, entry) => sum + entry.fats, 0);
  const totalFiber = energyEntries.reduce((sum, entry) => sum + entry.fiber, 0);
  const averageCalories = energyEntries.length > 0 ? totalCalories / energyEntries.length : 0;

  const formatLogDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Nutrition Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Entries</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Utensils className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">{energyEntries.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Calories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-orange-500 mr-2" />
              <span className="text-2xl font-bold">{totalCalories.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Protein</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-2xl font-bold">{totalProtein.toFixed(0)}g</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Calories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Apple className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{averageCalories.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macronutrients Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Macronutrients Overview
          </CardTitle>
          <CardDescription>Total macronutrients consumed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{totalProtein.toFixed(0)}g</div>
              <div className="text-sm text-gray-600">Protein</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalCarbs.toFixed(0)}g</div>
              <div className="text-sm text-gray-600">Carbs</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{totalFats.toFixed(0)}g</div>
              <div className="text-sm text-gray-600">Fats</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalFiber.toFixed(0)}g</div>
              <div className="text-sm text-gray-600">Fiber</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Utensils className="h-5 w-5 mr-2" />
            Recent Meals
          </CardTitle>
          <CardDescription>
            {isReadOnly ? `${profile.username}'s recent meals` : 'Your recent meals'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No meals logged yet</p>
              <p className="text-sm">
                {isReadOnly
                  ? "This user hasn't logged any meals yet."
                  : 'Start tracking your meals to see them here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-lg">{entry.meal_name}</h3>
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                          {entry.calories} cal
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatLogDate(entry.log_date)}
                        </div>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-1" />
                          {entry.protein.toFixed(0)}g protein
                        </div>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          {entry.carbohydrates.toFixed(0)}g carbs
                        </div>
                        <div className="flex items-center">
                          <Apple className="h-4 w-4 mr-1" />
                          {entry.fats.toFixed(0)}g fats
                        </div>
                      </div>
                      {entry.fiber > 0 && (
                        <div className="text-sm text-gray-600 mt-2">
                          Fiber: {entry.fiber.toFixed(0)}g
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

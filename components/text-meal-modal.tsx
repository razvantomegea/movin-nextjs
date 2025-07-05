'use client';

import { useState } from 'react';
import { PenTool, Loader2 } from 'lucide-react';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiMealData } from '@/utils/energy/mealHelpers';
import { MealDetectionResultsModal } from '../app/dashboard/energy/components/meal-detection-results/meal-detection-results-modal';

interface TextMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (description: string) => void;
}

export function TextMealModal({ isOpen, onClose, onAnalyze }: TextMealModalProps) {
  const [mealDescription, setMealDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealData, setMealData] = useState<ApiMealData | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = async () => {
    if (!mealDescription.trim()) {
      setError('Please enter a meal description');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-meal-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealDescription: mealDescription.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze meal');
      }

      if (result.success && result.data) {
        setMealData(result.data);
        setShowResults(true);
        // Call the callback for backward compatibility
        onAnalyze(mealDescription);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error analyzing meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze meal');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setMealDescription('');
    setError(null);
    setMealData(null);
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setMealDescription('');
    setError(null);
    setMealData(null);
    onClose();
  };

  const footer = (
    <div className="p-6">
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handleReset} disabled={isAnalyzing}>
          Clear
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={!mealDescription.trim() || isAnalyzing}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Meal'
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen && !showResults}
        onClose={onClose}
        title="Describe Your Meal"
        subtitle="Tell us what you ate and we'll analyze the nutrition for you"
        maxWidth="lg"
        footer={footer}
        contentClassName="p-6"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-description">What did you eat?</Label>
            <Textarea
              id="meal-description"
              placeholder="e.g., Grilled chicken breast with steamed broccoli and brown rice, or Pizza margherita with mozzarella and basil..."
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isAnalyzing}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start">
              <PenTool className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Tips for better analysis:
                </h4>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Include cooking methods (grilled, fried, steamed)</li>
                  <li>• Mention portion sizes when possible</li>
                  <li>• List main ingredients and sides</li>
                  <li>• Be specific about sauces or dressings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Meal Detection Results Modal */}
      <MealDetectionResultsModal
        isOpen={showResults}
        onClose={handleCloseResults}
        mealData={mealData}
        sourceType="text"
        originalDescription={mealDescription}
      />
    </>
  );
}

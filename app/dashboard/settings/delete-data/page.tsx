'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Database,
  Trash2,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import {
  getUserDataSummary,
  deleteAllUserData,
  type UserDataSummary,
  type DeleteResult,
} from '@/lib/supabase/deleteUserData';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DeleteDataPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();

  const [dataSummary, setDataSummary] = useState<UserDataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(1);
  const [confirmChecks, setConfirmChecks] = useState({
    understand: false,
    irreversible: false,
    backup: false,
  });
  const [confirmationText, setConfirmationText] = useState('');
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);

  const loadDataSummary = useCallback(async () => {
    if (!addressLower) return;

    try {
      setIsLoading(true);
      const summary = await getUserDataSummary({ address: addressLower });
      setDataSummary(summary);
    } catch (error) {
      console.error('Failed to load data summary:', error);
      dispatch(
        showErrorToast({
          title: 'Error',
          description: 'Failed to load your data summary. Please try again.',
        }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [addressLower, dispatch]);

  useEffect(() => {
    if (addressLower) {
      loadDataSummary();
    }
  }, [addressLower, loadDataSummary]);

  const handleDeleteData = async () => {
    if (!addressLower) return;

    try {
      setIsDeleting(true);
      const result = await deleteAllUserData({ address: addressLower });
      setDeleteResult(result);

      if (result.success) {
        dispatch(
          showSuccessToast({
            title: 'Data Deleted Successfully',
            description: 'All your data has been permanently removed from our systems.',
          }),
        );
        setConfirmationStep(4); // Show success step
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Failed to delete data:', error);
      dispatch(
        showErrorToast({
          title: 'Deletion Failed',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to delete your data. Please try again.',
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const allChecksConfirmed = Object.values(confirmChecks).every(Boolean);
  const confirmationTextCorrect = confirmationText === 'DELETE MY DATA';

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!dataSummary?.exists) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Data Found</h2>
            <p className="text-gray-500">You don&apos;t have any data in our system to delete.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-bold ml-4">Delete All Data</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Warning Alert */}
        <motion.div variants={item}>
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Warning:</strong> This action will permanently delete all your data and cannot
              be undone. Please make sure you have backed up any important information before
              proceeding.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Data Summary */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Your Data Summary
              </CardTitle>
              <CardDescription>
                Review what data will be permanently deleted from your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span>Activities:</span>
                  <Badge variant="outline">{dataSummary.summary.activities ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Badges Earned:</span>
                  <Badge variant="outline">{dataSummary.summary.user_badges ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Reward Claims:</span>
                  <Badge variant="outline">{dataSummary.summary.activity_rewards ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Staking Records:</span>
                  <Badge variant="outline">{dataSummary.summary.staking ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Meals Logged:</span>
                  <Badge variant="outline">{dataSummary.summary.meals ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Energy Entries:</span>
                  <Badge variant="outline">{dataSummary.summary.energy ?? 0}</Badge>
                </div>
                {/* --- Add missing fields below --- */}
                <div className="flex justify-between">
                  <span>Workouts:</span>
                  <Badge variant="outline">{dataSummary.summary.workouts ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Workout Exercises:</span>
                  <Badge variant="outline">{dataSummary.summary.workout_exercises ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Exercise Sets:</span>
                  <Badge variant="outline">{dataSummary.summary.exercise_sets ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Social Posts:</span>
                  <Badge variant="outline">{dataSummary.summary.social_posts ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Connections:</span>
                  <Badge variant="outline">{dataSummary.summary.connections ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Post Likes:</span>
                  <Badge variant="outline">{dataSummary.summary.post_likes ?? 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Post Comments:</span>
                  <Badge variant="outline">{dataSummary.summary.post_comments ?? 0}</Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Total Rewards:</span>
                  <Badge>{dataSummary.summary.total_rewards} tokens</Badge>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-medium">Total Staked:</span>
                  <Badge>{dataSummary.summary.total_staked} tokens</Badge>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="pt-4 border-t">
                <div className="font-semibold mb-2">Profile Information</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {dataSummary.summary.username && (
                    <div className="flex justify-between">
                      <span>Username:</span>
                      <span>{dataSummary.summary.username}</span>
                    </div>
                  )}
                  {dataSummary.summary.email && (
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{dataSummary.summary.email}</span>
                    </div>
                  )}
                  {dataSummary.summary.level !== undefined && (
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span>{dataSummary.summary.level}</span>
                    </div>
                  )}
                  {dataSummary.summary.streak_days !== undefined && (
                    <div className="flex justify-between">
                      <span>Streak Days:</span>
                      <span>{dataSummary.summary.streak_days}</span>
                    </div>
                  )}
                  {dataSummary.summary.is_premium !== undefined && (
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span>{dataSummary.summary.is_premium ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {dataSummary.summary.weight !== undefined && (
                    <div className="flex justify-between">
                      <span>Weight:</span>
                      <span>
                        {dataSummary.summary.weight} {dataSummary.summary.weight_unit || ''}
                      </span>
                    </div>
                  )}
                  {dataSummary.summary.height !== undefined && (
                    <div className="flex justify-between">
                      <span>Height:</span>
                      <span>{dataSummary.summary.height}</span>
                    </div>
                  )}
                  {dataSummary.summary.date_of_birth && (
                    <div className="flex justify-between">
                      <span>Date of Birth:</span>
                      <span>{dataSummary.summary.date_of_birth}</span>
                    </div>
                  )}
                  {dataSummary.summary.biological_sex && (
                    <div className="flex justify-between">
                      <span>Biological Sex:</span>
                      <span>{dataSummary.summary.biological_sex}</span>
                    </div>
                  )}
                  {dataSummary.summary.bio && (
                    <div className="flex justify-between">
                      <span>Bio:</span>
                      <span>{dataSummary.summary.bio}</span>
                    </div>
                  )}
                  {dataSummary.summary.avatar_url && (
                    <div className="flex justify-between">
                      <span>Avatar URL:</span>
                      <span className="truncate max-w-[120px]">
                        {dataSummary.summary.avatar_url}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confirmation Steps */}
        {confirmationStep === 1 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Step 1: Understand the Consequences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="understand"
                      checked={confirmChecks.understand}
                      onCheckedChange={(checked: boolean) =>
                        setConfirmChecks((prev) => ({ ...prev, understand: !!checked }))
                      }
                    />
                    <Label htmlFor="understand" className="text-sm leading-5">
                      I understand that all my data (activities, badges, rewards, meals, energy,
                      profile, and staking) will be permanently deleted
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="irreversible"
                      checked={confirmChecks.irreversible}
                      onCheckedChange={(checked: boolean) =>
                        setConfirmChecks((prev) => ({ ...prev, irreversible: !!checked }))
                      }
                    />
                    <Label htmlFor="irreversible" className="text-sm leading-5">
                      I understand this action is irreversible and cannot be undone
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="backup"
                      checked={confirmChecks.backup}
                      onCheckedChange={(checked: boolean) =>
                        setConfirmChecks((prev) => ({ ...prev, backup: !!checked }))
                      }
                    />
                    <Label htmlFor="backup" className="text-sm leading-5">
                      I have backed up any important data I want to keep
                    </Label>
                  </div>
                </div>

                <Button
                  onClick={() => setConfirmationStep(2)}
                  disabled={!allChecksConfirmed}
                  className="w-full mt-6"
                >
                  Continue to Final Confirmation
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {confirmationStep === 2 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Step 2: Final Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  To confirm you want to permanently delete all your data, type{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    DELETE MY DATA
                  </code>{' '}
                  in the field below:
                </p>

                <Input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type: DELETE MY DATA"
                  className="font-mono"
                />

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmationStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setConfirmationStep(3)}
                    disabled={!confirmationTextCorrect}
                    className="flex-1"
                  >
                    Proceed to Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {confirmationStep === 3 && (
          <motion.div variants={item}>
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Final Step: Delete Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is your last chance to cancel. Once you click the button below, all your data
                  will be permanently removed from our systems.
                </p>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmationStep(2)}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteData}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All My Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {confirmationStep === 4 && deleteResult && (
          <motion.div variants={item}>
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  {deleteResult.success ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  {deleteResult.success ? 'Data Deleted Successfully' : 'Deletion Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deleteResult.success ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All your data has been permanently removed from our systems:
                    </p>
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Activities: {deleteResult.deleted_counts.activities ?? 0}</div>
                        <div>Badges: {deleteResult.deleted_counts.user_badges ?? 0}</div>
                        <div>Rewards: {deleteResult.deleted_counts.activity_rewards ?? 0}</div>
                        <div>Stakes: {deleteResult.deleted_counts.staking ?? 0}</div>
                        <div>Meals: {deleteResult.deleted_counts.meals ?? 0}</div>
                        <div>Energy: {deleteResult.deleted_counts.energy ?? 0}</div>
                        {/* --- Add missing fields below --- */}
                        <div>Workouts: {deleteResult.deleted_counts.workouts ?? 0}</div>
                        <div>
                          Workout Exercises: {deleteResult.deleted_counts.workout_exercises ?? 0}
                        </div>
                        <div>Exercise Sets: {deleteResult.deleted_counts.exercise_sets ?? 0}</div>
                        <div>Social Posts: {deleteResult.deleted_counts.social_posts ?? 0}</div>
                        <div>Connections: {deleteResult.deleted_counts.connections ?? 0}</div>
                        <div>Post Likes: {deleteResult.deleted_counts.post_likes ?? 0}</div>
                        <div>Post Comments: {deleteResult.deleted_counts.post_comments ?? 0}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-red-600">
                    {deleteResult.error || 'An unknown error occurred during deletion.'}
                  </p>
                )}

                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

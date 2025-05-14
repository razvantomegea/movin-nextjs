'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ProfileErrorProps {
  error: string | null;
  onDismiss: () => void;
}

export function ProfileError({ error, onDismiss }: ProfileErrorProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4 mx-4 mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}

interface ProfileLoadingErrorProps {
  error: string;
  onRefresh: () => void;
}

export function ProfileLoadingError({ error, onRefresh }: ProfileLoadingErrorProps) {
  return (
    <div className="p-4">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading profile</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <Button onClick={onRefresh}>Try Again</Button>
    </div>
  );
}

interface ProfileNotFoundProps {
  onRefresh: () => void;
}

export function ProfileNotFound({ onRefresh }: ProfileNotFoundProps) {
  return (
    <div className="p-4">
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No profile found</AlertTitle>
        <AlertDescription>We couldn&apos;t find your profile information.</AlertDescription>
      </Alert>
      <Button onClick={onRefresh}>Refresh</Button>
    </div>
  );
}

import { Suspense } from 'react';
import { ProfilePage } from './components';
import { ProfilePageSkeleton } from './components/profile-page-skeleton';

export default function Profile() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePage />
    </Suspense>
  );
}

'use client';

import { useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/lib/redux/hooks';
import { updateProfile } from '@/lib/redux/slices/profileSlice';
import { IProfile } from '@/lib/supabase/profile';

interface ProfileEditFormProps {
  address?: string;
  profile: IProfile;
  isUpdating: boolean;
  onSave: (profileData: Partial<IProfile>) => void;
}

export function ProfileEditForm({ address, profile, isUpdating, onSave }: ProfileEditFormProps) {
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);

  const isSavingDisabled = isUpdating || (username === profile.username && email === profile.email);

  const handleSave = async () => {
    if (!address) {
      return;
    }

    const profileData: Partial<IProfile> = {
      ...(profile ?? {}),
      address,
      username,
      email,
    };

    onSave(profileData);
  };

  const handleUpdateUsername = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleUpdateEmail = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-800"
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={handleUpdateUsername}
            placeholder="Username"
            disabled={isUpdating}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={handleUpdateEmail}
            placeholder="Email"
            disabled={isUpdating}
          />
        </div>
        <Button onClick={handleSave} disabled={isSavingDisabled} className="w-full">
          {isUpdating ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

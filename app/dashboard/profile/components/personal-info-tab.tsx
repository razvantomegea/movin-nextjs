'use client';

import { format } from 'date-fns';
import { Cake, Scale, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IProfile } from '@/lib/supabase/profile';

interface PersonalInfoTabProps {
  profile: IProfile;
}

export function PersonalInfoTab({ profile }: PersonalInfoTabProps) {
  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your personal health and fitness details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date of Birth */}
          <div className="flex items-center px-3 py-2 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4">
              <Cake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">Date of Birth</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.date_of_birth
                  ? format(new Date(profile.date_of_birth), 'MMMM d, yyyy')
                  : 'Not provided'}
              </p>
            </div>
          </div>

          {/* Biological Sex */}
          <div className="flex items-center px-3 py-2 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Biological Sex</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.biological_sex
                  ? profile.biological_sex.charAt(0).toUpperCase() +
                    profile.biological_sex.slice(1).replace('_', ' ')
                  : 'Not provided'}
              </p>
            </div>
          </div>

          {/* Weight */}
          <div className="flex items-center px-3 py-2 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
              <Scale className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">Weight</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.weight
                  ? `${profile.weight} ${profile.weight_unit || 'kg'}`
                  : 'Not provided'}
                {profile.weight_updated_at && (
                  <span className="text-xs ml-2">
                    (Updated: {format(new Date(profile.weight_updated_at), 'MMM d, yyyy')})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Height */}
          <div className="flex items-center px-3 py-2 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
              <Scale className="h-5 w-5 text-green-600 dark:text-green-400 transform rotate-90" />
            </div>
            <div>
              <h3 className="font-medium">Height</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.height ? `${profile.height} cm` : 'Not provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { IProfile, ProfilePrivacySetting } from '@/lib/supabase/profile';

interface ProfileEditFormProps {
  profile: Partial<IProfile>;
  isUpdating: boolean;
  onSave: (profileData: Partial<IProfile>) => void;
}

const FormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  date_of_birth: z.date().optional(),
  biological_sex: z.enum(['male', 'female']).optional(),
  height: z.number().optional(),
  privacy_setting: z.enum(['public', 'partially_public', 'private']),
  allow_connection_requests: z.boolean(),
  profile_description: z
    .string()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional(),
  location: z
    .string()
    .max(100, { message: 'Location must be less than 100 characters' })
    .optional(),
  website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof FormSchema>;

// Use this interface to avoid type issues with profile properties
interface ProfileData {
  username?: string;
  email?: string;
  date_of_birth?: string;
  biological_sex?: string;
  height?: number;
  privacy_setting?: ProfilePrivacySetting;
  allow_connection_requests?: boolean;
  profile_description?: string;
  location?: string;
  website?: string;
}

export function ProfileEditForm({ profile, isUpdating, onSave }: ProfileEditFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: profile.username || '',
      email: profile.email || '',
      date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      biological_sex: profile.biological_sex as 'male' | 'female' | undefined,
      height: profile.height,
      privacy_setting: profile.privacy_setting || 'public',
      allow_connection_requests: profile.allow_connection_requests ?? true,
      profile_description: profile.profile_description || '',
      location: profile.location || '',
      website: profile.website || '',
    },
  });

  useEffect(() => {
    form.reset({
      username: profile.username || '',
      email: profile.email || '',
      date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      biological_sex: profile.biological_sex as 'male' | 'female' | undefined,
      height: profile.height,
      privacy_setting: profile.privacy_setting || 'public',
      allow_connection_requests: profile.allow_connection_requests ?? true,
      profile_description: profile.profile_description || '',
      location: profile.location || '',
      website: profile.website || '',
    });
  }, [profile, form]);

  const onSubmit = (data: FormValues) => {
    const profileData: ProfileData = {
      username: data.username,
      email: data.email,
      date_of_birth: data.date_of_birth ? format(data.date_of_birth, 'yyyy-MM-dd') : undefined,
      biological_sex: data.biological_sex,
      height: data.height,
      privacy_setting: data.privacy_setting,
      allow_connection_requests: data.allow_connection_requests,
      profile_description: data.profile_description || undefined,
      location: data.location || undefined,
      website: data.website || undefined,
    };

    onSave(profileData);
  };

  return (
    <div className="mt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Privacy Settings Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="privacy_setting"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<FormValues, 'privacy_setting'>;
                  }) => (
                    <FormItem>
                      <FormLabel>Profile Visibility</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select privacy setting" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">
                            <div>
                              <div className="font-medium">Public</div>
                              <div className="text-sm text-gray-500">
                                Anyone can view your full profile
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="partially_public">
                            <div>
                              <div className="font-medium">Partially Public</div>
                              <div className="text-sm text-gray-500">
                                Only connections can view full details
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div>
                              <div className="font-medium">Private</div>
                              <div className="text-sm text-gray-500">
                                Only you can view your profile
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Control who can see your profile information via the public profile link
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allow_connection_requests"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<FormValues, 'allow_connection_requests'>;
                  }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow connection requests</FormLabel>
                        <FormDescription>
                          Let other users send you connection requests to view your full profile
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Basic Profile Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }: { field: ControllerRenderProps<FormValues, 'username'> }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }: { field: ControllerRenderProps<FormValues, 'email'> }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Additional Profile Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="profile_description"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<FormValues, 'profile_description'>;
                  }) => (
                    <FormItem>
                      <FormLabel>About / Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell others about yourself..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be visible based on your privacy settings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<FormValues, 'location'>;
                    }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your general location (visible based on privacy settings)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<FormValues, 'website'>;
                    }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your personal website or social media link
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Health & Fitness Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Health & Fitness</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }: { field: ControllerRenderProps<FormValues, 'height'> }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Height in cm" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your height is used to calculate personalized metrics
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<FormValues, 'date_of_birth'>;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setDatePickerOpen(false);
                            }}
                            disabled={(date: Date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Your date of birth is used to customize your experience
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biological_sex"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<FormValues, 'biological_sex'>;
                  }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Biological Sex</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="male" />
                            </FormControl>
                            <FormLabel className="font-normal">Male</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="female" />
                            </FormControl>
                            <FormLabel className="font-normal">Female</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Used for personalized health metrics and recommendations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button variant="outline" type="button" onClick={() => onSave(profile)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

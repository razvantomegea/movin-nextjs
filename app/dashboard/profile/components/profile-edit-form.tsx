'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { cn } from '@/lib/cn';
import { IProfile } from '@/lib/supabase/profile';

interface ProfileEditFormProps {
  address: string;
  profile: IProfile;
  isUpdating: boolean;
  onSave: (profileData: Partial<IProfile>) => void;
}

const FormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  date_of_birth: z.date().optional(),
  biological_sex: z.enum(['male', 'female']).optional(),
  height: z.number().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

// Use this interface to avoid type issues with profile properties
interface ProfileData {
  username?: string;
  email?: string;
  date_of_birth?: string;
  biological_sex?: string;
  height?: number;
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
    },
  });

  useEffect(() => {
    form.reset({
      username: profile.username || '',
      email: profile.email || '',
      date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      biological_sex: profile.biological_sex as 'male' | 'female' | undefined,
      height: profile.height,
    });
  }, [profile, form]);

  const onSubmit = (data: FormValues) => {
    const profileData: ProfileData = {
      username: data.username,
      email: data.email,
      date_of_birth: data.date_of_birth ? format(data.date_of_birth, 'yyyy-MM-dd') : undefined,
      biological_sex: data.biological_sex,
      height: data.height,
    };

    onSave(profileData);
  };

  return (
    <div className="mt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="flex justify-end space-x-2">
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

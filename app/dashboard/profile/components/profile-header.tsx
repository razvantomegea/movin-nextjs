'use client';

import { useRef, ChangeEvent, useState } from 'react';
import {
  Camera,
  Edit,
  Trophy,
  Flame,
  Activity,
  Loader2,
  X,
  Upload,
  FileText,
  FileImage,
  AlertCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IProfile } from '@/lib/supabase/profile';
import { validateAvatarFile, formatFileSize, getStorageConfig } from '@/lib/supabase/storage';

interface ProfileHeaderProps {
  profile: IProfile;
  isUpdating: boolean;
  isEditing: boolean;
  balance: string;
  onEdit: (isEditing: boolean) => void;
  onAvatarUpload: (file: File) => void;
}

export function ProfileHeader({
  profile,
  isUpdating,
  isEditing,
  balance,
  onEdit,
  onAvatarUpload,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileValidation, setFileValidation] = useState<ReturnType<
    typeof validateAvatarFile
  > | null>(null);

  // Get storage configuration
  const storageConfig = getStorageConfig();

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Validate file
      const validation = validateAvatarFile(file);
      setFileValidation(validation);

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleConfirmUpload = () => {
    if (selectedFile && fileValidation?.isValid) {
      onAvatarUpload(selectedFile);
      // Reset after upload starts
      resetFileSelection();
    }
  };

  const handleCancelUpload = () => {
    resetFileSelection();
  };

  const resetFileSelection = () => {
    setSelectedFile(null);
    setFileValidation(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditClick = () => {
    onEdit(!isEditing);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <div className="relative mb-4 sm:mb-0 sm:mr-6">
            <Avatar className="h-24 w-24 border-4 border-blue-500">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="Preview" />
              ) : (
                <AvatarImage
                  src={profile.avatar_url || '/placeholder.svg?height=96&width=96'}
                  alt="User"
                />
              )}
              <AvatarFallback className="text-2xl dark:bg-blue-900 dark:text-blue-100 bg-blue-100 text-blue-900">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
              {!selectedFile && (
                <span>
                  Max {storageConfig.maxFileSizeFormatted}
                  <span className="hidden sm:inline"> · JPG, PNG, GIF, WebP</span>
                </span>
              )}
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              onClick={handleAvatarClick}
              disabled={isUpdating || !!selectedFile}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept={storageConfig.allowedMimeTypes.join(',')}
              className="hidden"
              aria-label="Upload avatar"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{profile.username}</h2>
                <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 sm:mt-0"
                onClick={handleEditClick}
                disabled={isUpdating}
              >
                {isEditing ? (
                  'Cancel'
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </>
                )}
              </Button>
            </div>

            {selectedFile && fileValidation && (
              <div className="mt-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FileImage className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="font-medium">Selected Image</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelUpload}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center">
                    <FileText className="h-4 w-4 mr-1.5 text-gray-500" />
                    {selectedFile.name}
                  </p>
                  <p className={`${!fileValidation.isTypeOk ? 'text-red-500' : 'text-gray-500'}`}>
                    Type: {selectedFile.type}
                    {!fileValidation.isTypeOk && (
                      <span className="ml-1 flex items-center">
                        <AlertCircle className="h-3.5 w-3.5 ml-1" />
                      </span>
                    )}
                  </p>
                  <p className={`${!fileValidation.isSizeOk ? 'text-red-500' : 'text-gray-500'}`}>
                    Size: {fileValidation.sizeInfo}
                    {!fileValidation.isSizeOk && (
                      <span className="ml-1 flex items-center">
                        <AlertCircle className="h-3.5 w-3.5 ml-1" />
                        <span className="ml-1">Max: {storageConfig.maxFileSizeFormatted}</span>
                      </span>
                    )}
                  </p>
                </div>

                {!fileValidation.isValid && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>{fileValidation.errorMessage}</span>
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleConfirmUpload}
                    disabled={isUpdating || !fileValidation.isValid}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
              <Badge variant="secondary" className="flex items-center">
                <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                Level {profile.level}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                {profile.streak_days} Day Streak
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <Activity className="h-3 w-3 mr-1 text-blue-500" />
                {balance}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

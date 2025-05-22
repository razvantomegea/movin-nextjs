import { useRef, ChangeEvent, useState } from 'react';
import { Loader2, Camera, X, Upload, FileText, FileImage, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppDispatch } from '@/lib/redux/hooks';
import { fetchProfile, updateProfile } from '@/lib/redux/slices/profileSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { validateAvatarFile, uploadAvatar } from '@/lib/supabase/storage';
import { formatAddress } from '@/utils/crypto';

interface ProfileUploadModalProps {
  open: boolean;
  onClose: () => void;
  isUpdating: boolean;
  storageConfig: ReturnType<typeof import('@/lib/supabase/storageConstants').getStorageConfig>;
  currentAvatarUrl?: string;
  username: string;
}

export function ProfileUploadModal({
  open,
  onClose,
  isUpdating,
  storageConfig,
  currentAvatarUrl,
  username,
}: ProfileUploadModalProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileValidation, setFileValidation] = useState<ReturnType<
    typeof validateAvatarFile
  > | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { address } = useAccount();

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Clean up any earlier preview to avoid leaking
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      const validation = validateAvatarFile(file);
      setFileValidation(validation);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !fileValidation?.isValid || !address) return;

    setIsUploading(true);

    try {
      // Validate the file first
      const validation = validateAvatarFile(selectedFile);

      if (!validation.isValid) {
        dispatch(
          showErrorToast({
            title: 'Invalid File',
            description: validation.errorMessage || 'Please select a valid image file',
          }),
        );
        return;
      }

      // Show upload started toast
      dispatch(
        showSuccessToast({
          title: 'Upload Started',
          description: `Uploading ${selectedFile.name} (${validation.sizeInfo})...`,
        }),
      );

      // Upload avatar to Supabase storage
      const avatarUrl = await uploadAvatar(selectedFile, address);

      // Update profile with new avatar URL
      await dispatch(
        updateProfile({
          address,
          profileData: { avatar_url: avatarUrl },
        }),
      ).unwrap();

      // Refresh profile data
      await dispatch(fetchProfile(address)).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Avatar Updated',
          description: 'Your profile picture has been successfully updated',
        }),
      );

      // Close modal and reset
      resetFileSelection();
      onClose();
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Please try again later',
        }),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    resetFileSelection();
    onClose();
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogTitle>Upload New Avatar</DialogTitle>
        <div className="flex flex-col items-center">
          <Avatar
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAvatarClick()}
            className="h-24 w-24 border-4 border-blue-500 mb-4"
            onClick={handleAvatarClick}
          >
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Preview" />
            ) : (
              <AvatarImage
                src={currentAvatarUrl || '/placeholder.svg?height=96&width=96'}
                alt="User"
              />
            )}
            <AvatarFallback className="text-2xl dark:bg-blue-900 dark:text-blue-100 bg-blue-100 text-blue-900">
              {formatAddress(username)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            className="mb-2"
            onClick={handleAvatarClick}
            disabled={isUpdating || isUploading}
            aria-label="Select avatar image"
          >
            <Camera className="h-5 w-5" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept={storageConfig.allowedMimeTypes.join(',')}
            className="hidden"
            aria-label="Upload avatar"
          />
          <div className="text-xs text-gray-500 mt-1 mb-2">
            Max {storageConfig.maxFileSizeFormatted}
            <span className="hidden sm:inline"> · JPG, PNG, GIF, WebP</span>
          </div>

          {selectedFile && fileValidation && (
            <div className="mt-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800 w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FileImage className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="font-medium">Selected Image</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFileSelection}
                  className="h-6 w-6 p-0"
                  aria-label="Remove selected image"
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
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={handleCancelUpload} disabled={isUpdating || isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpload}
            disabled={isUpdating || isUploading || !selectedFile || !fileValidation?.isValid}
          >
            {isUpdating || isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

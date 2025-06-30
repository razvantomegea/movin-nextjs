'use client';

import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch } from '@/lib/redux/hooks';
import { uploadPostImageAsync } from '@/lib/redux/slices/socialFeedSlice';

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (content: string, image?: string) => void;
  userAddress: string;
}

export function ShareAchievementModal({
  isOpen,
  onClose,
  onShare,
  userAddress,
}: ShareAchievementModalProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const achievementImages = [
    '/urban-dawn-dash.png',
    '/diverse-fitness-group.png',
    '/park-stroll.png',
    '/triumphant-finish.png',
    '/diverse-group-city.png',
    '/triumphant-athlete.png',
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setSelectedImage(null); // Clear preset image selection

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;

      // Upload custom image if selected
      if (selectedFile) {
        setIsUploadingImage(true);
        try {
          imageUrl = await dispatch(
            uploadPostImageAsync({ file: selectedFile, userId: userAddress }),
          ).unwrap();
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert('Failed to upload image. Please try again.');
          return;
        } finally {
          setIsUploadingImage(false);
        }
      } else if (selectedImage && selectedImage.startsWith('/')) {
        // Use preset image
        imageUrl = selectedImage;
      }

      await onShare(content, imageUrl);

      // Reset form
      setContent('');
      setSelectedImage(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Achievement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="post-content">What did you accomplish?</Label>
            <Textarea
              id="post-content"
              placeholder="Share your fitness achievement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-2 block">Add a photo (optional)</Label>

            {/* Custom file upload */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-2"
                disabled={isUploadingImage}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploadingImage ? 'Uploading...' : 'Upload Custom Image'}
              </Button>
            </div>

            {/* Show selected custom image */}
            {selectedFile && selectedImage && (
              <div className="mb-4">
                <div className="relative w-full h-32 rounded-md overflow-hidden border-2 border-blue-500">
                  <Image src={selectedImage} alt="Selected image" fill className="object-cover" />
                  <div className="absolute top-2 right-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Preset images - only show if no custom image is selected */}
            {!selectedFile && (
              <div>
                <Label className="mb-2 block text-sm text-muted-foreground">
                  Or choose from preset images:
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {achievementImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
                        selectedImage === image ? 'border-blue-500' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(image === selectedImage ? null : image)}
                    >
                      <Image
                        src={image || '/placeholder.svg'}
                        alt={`Achievement ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {selectedImage === image && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="bg-blue-500 rounded-full p-1">
                            <X
                              className="h-4 w-4 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting || isUploadingImage}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!content.trim() || isSubmitting || isUploadingImage}
            className="ml-2"
          >
            {isUploadingImage ? 'Uploading Image...' : isSubmitting ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
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

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (content: string, image?: string) => void;
}

export function ShareAchievementModal({ isOpen, onClose, onShare }: ShareAchievementModalProps) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const achievementImages = [
    '/urban-dawn-dash.png',
    '/diverse-fitness-group.png',
    '/park-stroll.png',
    '/triumphant-finish.png',
    '/diverse-group-city.png',
    '/triumphant-athlete.png',
  ];

  const handleShare = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      onShare(content, selectedImage || undefined);
      setContent('');
      setSelectedImage(null);
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={!content.trim() || isSubmitting} className="ml-2">
            {isSubmitting ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

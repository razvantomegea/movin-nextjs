'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { AlertTriangle, Bug, CheckCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { captureUserFeedback } from '@/lib/sentry/feedback';

interface BugReportModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  eventId?: string;
  feedbackType?: 'bug' | 'feedback';
  prefilledData?: {
    title?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high';
  };
}

export function BugReportModal({
  trigger,
  isOpen,
  onOpenChange,
  eventId,
  feedbackType = 'bug',
  prefilledData,
}: BugReportModalProps) {
  const { address } = useAppKitAccount();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: prefilledData?.title || '',
    description: prefilledData?.description || '',
    severity: prefilledData?.severity || ('medium' as 'low' | 'medium' | 'high'),
    reproductionSteps: '',
  });

  const isBugReport = feedbackType === 'bug';
  const modalTitle = isBugReport ? 'Report a Bug' : 'Send Feedback';
  const modalDescription = isBugReport
    ? 'Help us improve by reporting any issues you have encountered. Your feedback is valuable to us.'
    : 'We would love to hear your thoughts! Share your feedback, suggestions, or ideas with us.';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackText = isBugReport
        ? `
**Bug Report**
**Title:** ${formData.title}
**Severity:** ${formData.severity}
**Description:** ${formData.description}

**Steps to Reproduce:**
${formData.reproductionSteps}

**User Info:**
- Wallet: ${address || 'Not connected'}
- Timestamp: ${new Date().toISOString()}
      `.trim()
        : `
**User Feedback**
**Title:** ${formData.title}
**Description:** ${formData.description}

**User Info:**
- Wallet: ${address || 'Not connected'}
- Timestamp: ${new Date().toISOString()}
      `.trim();

      await captureUserFeedback({
        name: formData.name,
        email: formData.email,
        comments: feedbackText,
        eventId,
        user: {
          id: address?.toLowerCase(),
          email: formData.email,
        },
      });

      setIsSubmitted(true);

      // Reset form after a delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          title: '',
          description: '',
          severity: 'medium',
          reproductionSteps: '',
        });
        onOpenChange?.(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit bug report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Feedback Submitted</DialogTitle>
            <DialogDescription>Thank you for your feedback submission</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-green-700">Thank you for your feedback!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your {isBugReport ? 'bug report' : 'feedback'} has been submitted successfully.
              We&apos;ll investigate the issue and get back to you if needed.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBugReport ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <MessageSquare className="h-5 w-5 text-blue-500" />
            )}
            {modalTitle}
          </DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{isBugReport ? 'Bug Title' : 'Feedback Title'}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {isBugReport && (
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((severity) => (
                  <Badge
                    key={severity}
                    variant={formData.severity === severity ? 'default' : 'outline'}
                    className={`cursor-pointer capitalize ${
                      formData.severity === severity ? severityColors[severity] : ''
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={formData.severity === severity}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setFormData((prev) => ({ ...prev, severity }));
                      }
                    }}
                    onClick={() => setFormData((prev) => ({ ...prev, severity }))}
                  >
                    {severity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">{isBugReport ? 'Description' : 'Your Feedback'}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={
                isBugReport
                  ? 'Describe what happened and what you expected to happen'
                  : 'Share your thoughts, suggestions, or ideas with us'
              }
              rows={4}
              required
            />
          </div>

          {isBugReport && (
            <div className="space-y-2">
              <Label htmlFor="reproductionSteps">Steps to Reproduce</Label>
              <Textarea
                id="reproductionSteps"
                value={formData.reproductionSteps}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reproductionSteps: e.target.value }))
                }
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  {isBugReport ? (
                    <Bug className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  {isBugReport ? 'Submit Bug Report' : 'Send Feedback'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

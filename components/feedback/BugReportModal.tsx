'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { AlertTriangle, Bug, CheckCircle, MessageSquare, X } from 'lucide-react';
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
      console.error('Failed to submit feedback:', error);
      // Could add error toast here if needed
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
        <DialogContent className="w-full h-full max-w-none max-h-none sm:max-w-md sm:h-auto sm:w-auto overflow-hidden p-0 bg-white dark:bg-gray-900 shadow-xl">
          <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-0">
            <DialogTitle className="text-lg sm:text-xl font-bold">Feedback Submitted</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange?.(false)}
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Your feedback has been successfully submitted.
          </DialogDescription>

          {/* Success Content */}
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1">
            <CheckCircle className="h-20 w-20 sm:h-16 sm:w-16 text-green-500 mb-6 sm:mb-4" />
            <h3 className="text-2xl sm:text-xl font-semibold text-green-700 mb-4 sm:mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-base sm:text-sm text-muted-foreground leading-relaxed max-w-md">
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
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-full h-full max-w-none max-h-none sm:max-w-2xl sm:max-h-[90vh] sm:h-auto sm:w-auto overflow-hidden p-0 bg-white dark:bg-gray-900 shadow-xl flex flex-col">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-0">
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            {isBugReport ? (
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            ) : (
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            )}
            {modalTitle}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange?.(false)}
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </DialogHeader>

        <DialogDescription className="flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {modalDescription}
          </span>
        </DialogDescription>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            <form id="bug-report-form" onSubmit={handleSubmit} className="space-y-0" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">{isBugReport ? 'Bug Title' : 'Feedback Title'}</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  required
                  aria-required="true"
                />
              </div>

              {isBugReport && (
                <div className="space-y-2">
                  <Label id="severity-label" htmlFor="severity">
                    Severity
                  </Label>
                  <div className="flex gap-2" role="radiogroup" aria-labelledby="severity-label">
                    {(['low', 'medium', 'high'] as const).map((severity) => (
                      <Badge
                        key={severity}
                        variant={formData.severity === severity ? 'default' : 'outline'}
                        className={`cursor-pointer capitalize ${
                          formData.severity === severity ? severityColors[severity] : ''
                        }`}
                        role="radio"
                        tabIndex={0}
                        aria-checked={formData.severity === severity}
                        aria-label={`Set severity to ${severity}`}
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
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder={
                    isBugReport
                      ? 'Describe what happened and what you expected to happen'
                      : 'Share your thoughts, suggestions, or ideas with us'
                  }
                  rows={4}
                  required
                  aria-required="true"
                />
              </div>

              {isBugReport && (
                <div className="space-y-2">
                  <Label htmlFor="reproductionSteps">Steps to Reproduce</Label>
                  <Textarea
                    id="reproductionSteps"
                    name="reproductionSteps"
                    value={formData.reproductionSteps}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reproductionSteps: e.target.value }))
                    }
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                    rows={3}
                  />
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Action Buttons - Fixed Footer */}
        <DialogFooter className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-3 sm:gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="bug-report-form"
              disabled={isSubmitting}
              className="gap-2 w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
            >
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

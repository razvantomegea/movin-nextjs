'use client';

import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBugReport } from '@/lib/hooks/useBugReport';
import { BugReportModal } from './BugReportModal';

interface BugReportButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  // Use Sentry's native dialog instead of custom modal
  useSentryDialog?: boolean;
  // Prefilled data for the report
  prefilledData?: {
    title?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high';
  };
  eventId?: string;
}

export function BugReportButton({
  variant = 'outline',
  size = 'sm',
  className,
  children,
  useSentryDialog = false,
  prefilledData,
  eventId,
}: BugReportButtonProps) {
  const {
    isModalOpen,
    openBugReport,
    closeBugReport,
    showSentryDialog,
    eventId: hookEventId,
    prefilledData: hookPrefilledData,
  } = useBugReport();

  const handleClick = () => {
    if (useSentryDialog) {
      showSentryDialog({
        eventId,
        title: prefilledData?.title ? `Report Issue: ${prefilledData.title}` : undefined,
      });
    } else {
      openBugReport({
        eventId,
        ...prefilledData,
      });
    }
  };

  const buttonContent = children || (
    <>
      <Bug className="h-4 w-4" />
      Report Bug
    </>
  );

  if (useSentryDialog) {
    return (
      <Button variant={variant} size={size} className={className} onClick={handleClick}>
        {buttonContent}
      </Button>
    );
  }

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={handleClick}>
        {buttonContent}
      </Button>

      <BugReportModal
        isOpen={isModalOpen}
        onOpenChange={closeBugReport}
        eventId={hookEventId || eventId}
        prefilledData={hookPrefilledData || prefilledData}
      />
    </>
  );
}

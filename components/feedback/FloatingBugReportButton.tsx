'use client';

import { useState, useEffect } from 'react';
import { Bug, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { BugReportModal } from './BugReportModal';

interface FloatingBugReportButtonProps {
  className?: string;
}

export function FloatingBugReportButton({ className }: FloatingBugReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feedback'>('bug');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <TooltipProvider>
        <div
          className={cn(
            'fixed z-50 flex flex-col gap-2',
            // Dynamic positioning based on device
            isMobile
              ? 'bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4'
              : 'bottom-6 right-6',
            className,
          )}
        >
          {/* Expanded options */}
          {isExpanded && (
            <div className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    aria-label="Report a Bug"
                    onClick={() => {
                      setFeedbackType('bug');
                      setIsModalOpen(true);
                      setIsExpanded(false);
                    }}
                  >
                    <Bug className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Report a Bug</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    aria-label="Send Feedback"
                    onClick={() => {
                      setFeedbackType('feedback');
                      setIsModalOpen(true);
                      setIsExpanded(false);
                    }}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Send Feedback</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Main floating action button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                className={cn(
                  'h-16 w-16 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
                  'bg-orange-500 hover:bg-orange-600 text-white',
                  'border-2 border-white/20',
                  isExpanded && 'rotate-45',
                )}
                aria-label={isExpanded ? 'Close feedback menu' : 'Open feedback menu'}
                onClick={() => {
                  if (isExpanded) {
                    setIsExpanded(false);
                  } else {
                    setIsExpanded(true);
                  }
                }}
              >
                {isExpanded ? (
                  <X className="h-6 w-6 transition-transform duration-200" />
                ) : (
                  <Bug className="h-6 w-6 transition-transform duration-200" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isExpanded ? 'Close' : 'Report Issues'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        feedbackType={feedbackType}
      />
    </>
  );
}

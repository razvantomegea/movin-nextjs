import { ReactNode } from 'react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

interface ResponsiveTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
}

export function ResponsiveTooltip({
  children,
  content,
  side = 'top',
  sideOffset = 4,
  className,
}: ResponsiveTooltipProps) {
  const isMobile = useMediaQuery('(pointer: coarse)');

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent side={side} sideOffset={sideOffset} className={className}>
          {content}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} sideOffset={sideOffset} className={className}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

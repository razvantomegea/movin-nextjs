import { HTMLAttributes } from 'react';
import { cn } from '@/utils';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-secondary', className)} {...props} />;
}

export { Skeleton };

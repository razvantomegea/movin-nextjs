import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className = '' }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center p-3 mt-2 text-sm bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md ${className}`}
    >
      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

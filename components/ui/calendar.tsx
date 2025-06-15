'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(props.defaultMonth || new Date());

  // Handle month change
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    if (props.onMonthChange) {
      props.onMonthChange(month);
    }
  };

  // Handle year change
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    handleMonthChange(newDate);
  };

  // Generate years for dropdown (±30 years from current year)
  const currentYear = currentMonth.getFullYear();
  const years = React.useMemo(() => {
    return Array.from({ length: 61 }, (_, i) => currentYear - 30 + i);
  }, [currentYear]);

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex justify-center">
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          aria-label="Year"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Standard day picker */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn('p-3', className)}
        classNames={{
          months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
          month: 'space-y-4',
          caption: 'flex justify-center pt-1 relative items-center',
          caption_label: 'text-sm font-medium',
          nav: 'space-x-1 flex items-center',
          nav_button: cn(
            buttonVariants({ variant: 'outline' }),
            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          ),
          nav_button_previous: 'absolute left-1',
          nav_button_next: 'absolute right-1',
          table: 'w-full border-collapse space-y-1',
          head_row: 'flex',
          head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
          row: 'flex w-full mt-2',
          cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
          day: cn(
            buttonVariants({ variant: 'ghost' }),
            'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
          ),
          day_selected:
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
          day_today: 'bg-accent text-accent-foreground',
          day_outside: 'text-muted-foreground opacity-50',
          day_disabled: 'text-muted-foreground opacity-50',
          day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
          day_hidden: 'invisible',
          ...classNames,
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        }}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

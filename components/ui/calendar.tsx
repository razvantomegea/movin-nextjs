'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { DayPicker, DateFormatter } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(props.defaultMonth || new Date());
  const [isYearPickerOpen, setIsYearPickerOpen] = React.useState(false);

  // Sync with defaultMonth prop when it changes
  React.useEffect(() => {
    if (props.defaultMonth) {
      setCurrentMonth(props.defaultMonth);
    }
  }, [props.defaultMonth]);

  // Handle month change
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    if (props.onMonthChange) {
      props.onMonthChange(month);
    }
  };

  // Handle year change
  const handleYearChange = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    handleMonthChange(newDate);
    setIsYearPickerOpen(false);
  };

  // Change year by offset
  const changeYear = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(currentMonth.getFullYear() + offset);
    handleMonthChange(newDate);
  };

  // Generate years for picker (±10 years from current year)
  const currentYear = currentMonth.getFullYear();
  const years = React.useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  }, [currentYear]);

  // Custom caption component that only shows month name
  const formatCaption: DateFormatter = (month) => {
    return month.toLocaleDateString(undefined, { month: 'long' });
  };

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex justify-center relative">
        <div className="inline-flex items-center rounded-md border border-input bg-background shadow-sm">
          <button
            onClick={() => changeYear(-1)}
            className="px-2 py-1 h-9 border-r"
            aria-label="Previous Year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
            className="px-3 py-1 h-9 inline-flex items-center justify-center gap-1 font-medium"
            aria-label="Select Year"
            aria-expanded={isYearPickerOpen}
            aria-haspopup="listbox"
          >
            {currentYear}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>

          <button
            onClick={() => changeYear(1)}
            className="px-2 py-1 h-9 border-l"
            aria-label="Next Year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Year picker popover */}
        {isYearPickerOpen && (
          <div className="absolute top-full mt-1 z-50 bg-background border rounded-md shadow-md p-2 max-h-[200px] overflow-y-auto w-[100px]">
            <div className="grid grid-cols-1 gap-1" role="listbox">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md text-center',
                    year === currentYear ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                  role="option"
                  aria-selected={year === currentYear}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Standard day picker */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn('p-3', className)}
        formatters={{ formatCaption }}
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
          IconLeft: (iconProps) => (
            <ChevronLeft {...iconProps} className={cn('h-4 w-4', iconProps.className)} />
          ),
          IconRight: (iconProps) => (
            <ChevronRight {...iconProps} className={cn('h-4 w-4', iconProps.className)} />
          ),
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

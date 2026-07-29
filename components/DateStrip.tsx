"use client";

import { CalendarDays } from "lucide-react";
import { addDays, dateMonthDay, dateWeekdayShort, startOfWeek } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

type DateStripProps = {
  date: string;
  weekStartsOn: 0 | 1 | 6;
  locale: string;
  disabled?: boolean;
  onChange: (date: string) => void;
};

export function DateStrip({ date, weekStartsOn, locale, disabled = false, onChange }: DateStripProps) {
  const weekStart = startOfWeek(date, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <section className="flex min-w-0 items-center gap-2" aria-label="Nearby dates">
      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground sm:flex">
        <CalendarDays className="h-4 w-4" />
      </div>
      <div className="timegrid-scrollbar flex min-w-0 gap-1 overflow-x-auto rounded-md border border-border bg-background p-1">
        {days.map((day) => {
          const active = day === date;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onChange(day)}
              disabled={disabled}
              className={cn(
                "grid min-w-16 rounded px-3 py-1.5 text-center text-sm transition focus:outline-none focus:ring-2 focus:ring-primary",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={active ? "date" : undefined}
            >
              <span className="text-[10px] font-bold uppercase">{dateWeekdayShort(day, locale)}</span>
              <span className="font-semibold">{dateMonthDay(day, locale)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

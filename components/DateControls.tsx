"use client";

import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { addDays, dateLabel, todayIsoDate } from "@/lib/time-utils";

type DateControlsProps = {
  date: string;
  locale: string;
  disabled?: boolean;
  onChange: (date: string) => void;
};

export function DateControls({ date, locale, disabled = false, onChange }: DateControlsProps) {
  return (
    <section className="flex flex-wrap items-center gap-2" aria-label="Date controls">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        disabled={disabled}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Previous day"
        title="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <label className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="date"
          value={date}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-10 rounded-md border border-border bg-card pl-9 pr-3 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Choose date"
        />
      </label>
      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        disabled={disabled}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Next day"
        title="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange(todayIsoDate())}
        disabled={disabled}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <RotateCcw className="h-4 w-4" />
        Today
      </button>
      <p className="min-w-0 text-sm font-semibold text-muted-foreground">{dateLabel(date, locale)}</p>
    </section>
  );
}

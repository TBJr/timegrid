"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useState } from "react";
import { findBestMeetingSlotsAcrossDays, formatTime, baseMinuteToUtc, dateLabel } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import type { SchedulingRules, SelectionRange, WorkingHours, ZoneEntry } from "@/types";

type BestTimesPanelProps = {
  date: string;
  zones: ZoneEntry[];
  workingHours: WorkingHours;
  schedulingRules: SchedulingRules;
  durationMinutes: number;
  locale: string;
  readOnly?: boolean;
  onSelect: (selection: SelectionRange, date: string) => void;
};

export function BestTimesPanel({ date, zones, workingHours, schedulingRules, durationMinutes, locale, readOnly = false, onSelect }: BestTimesPanelProps) {
  const [horizon, setHorizon] = useState(7);
  const anchorZone = zones[0]?.timeZone ?? "UTC";
  const slots = findBestMeetingSlotsAcrossDays(date, horizon, zones, workingHours, durationMinutes, 5, anchorZone, schedulingRules);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft" aria-labelledby="best-times-title">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 id="best-times-title" className="text-sm font-semibold">
          Best meeting times
        </h2>
      </div>
      <div className="mb-3 grid grid-cols-3 rounded-md border border-border bg-background p-1">
        {[1, 7, 14].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => setHorizon(days)}
            className={cn(
              "h-8 rounded text-xs font-semibold transition",
              horizon === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {days === 1 ? "Today" : `${days} days`}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {slots.map((slot) => (
          <button
            key={`${slot.date}-${slot.startMinute}-${slot.endMinute}`}
            type="button"
            onClick={() => onSelect({ startMinute: slot.startMinute, endMinute: slot.endMinute }, slot.date)}
            disabled={readOnly}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {formatTime(baseMinuteToUtc(slot.date, slot.startMinute, anchorZone), anchorZone, locale)}-
                {formatTime(baseMinuteToUtc(slot.date, slot.endMinute, anchorZone), anchorZone, locale)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {dateLabel(slot.date, locale)} · shown in {zones[0]?.label ?? "UTC"}
              </span>
              {slot.worstParticipant ? (
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-200">
                  <AlertTriangle className="h-3 w-3" />
                  Hardest for {slot.worstParticipant}
                </span>
              ) : null}
            </span>
            <span className="grid justify-items-end gap-1">
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-semibold capitalize",
                  slot.quality === "great" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  slot.quality === "okay" && "bg-amber-500/20 text-amber-800 dark:text-amber-200",
                  slot.quality === "bad" && "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                )}
              >
                {slot.quality}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">Pain {slot.averagePain.toFixed(1)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

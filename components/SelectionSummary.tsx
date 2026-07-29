"use client";

import { CalendarPlus, Clipboard, Download, FileSpreadsheet, Link as LinkIcon, MessageSquareText } from "lucide-react";
import { useState } from "react";
import {
  createIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  selectedTimeCsv,
  selectedTimePdfBlob,
  selectedTimePngDataUrl,
  slackSummary,
  teamsSummary
} from "@/lib/calendar";
import { baseMinuteToUtc, findFairRecurringRotation, formatClockTime, formatSelectionSummary, participantPainForSelection } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import type { RecurrenceFrequency, RecurrenceRule, SchedulingRules, SelectionRange, WorkingHours, ZoneEntry } from "@/types";

type SelectionSummaryProps = {
  date: string;
  selection: SelectionRange | null;
  zones: ZoneEntry[];
  workingHours: WorkingHours;
  schedulingRules: SchedulingRules;
  shareUrl: string;
  locale: string;
  onSelect?: (selection: SelectionRange, date: string) => void;
};

function recurrenceFrequencyForRotation(frequency: RecurrenceFrequency) {
  return frequency === "daily" || frequency === "weekly" || frequency === "biweekly" || frequency === "monthly" ? frequency : null;
}

export function SelectionSummary({ date, selection, zones, workingHours, schedulingRules, shareUrl, locale, onSelect }: SelectionSummaryProps) {
  const anchorTimeZone = zones[0]?.timeZone ?? "UTC";
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({ frequency: "none", count: 6 });
  const summary = selection ? formatSelectionSummary(date, selection, zones, anchorTimeZone, locale) : "";
  const pains = selection ? participantPainForSelection(date, selection, zones, workingHours, anchorTimeZone, schedulingRules) : [];
  const activeRecurrence = recurrence.frequency === "none" ? undefined : recurrence;
  const rotationFrequency = recurrenceFrequencyForRotation(recurrence.frequency);
  const fairnessRotation =
    selection && rotationFrequency
      ? findFairRecurringRotation(
          date,
          rotationFrequency,
          recurrence.count,
          zones,
          workingHours,
          selection.endMinute - selection.startMinute,
          anchorTimeZone,
          schedulingRules
        )
      : [];

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  function downloadIcs() {
    if (!selection) return;
    const blob = new Blob([createIcs(date, selection, zones, anchorTimeZone, locale, activeRecurrence)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timegrid-meeting.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    if (!selection) return;
    const blob = new Blob([selectedTimeCsv(date, selection, zones, anchorTimeZone, locale)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timegrid-selected-time.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    if (!selection) return;
    const dataUrl = selectedTimePngDataUrl(date, selection, zones, anchorTimeZone, locale);
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "timegrid-meeting.png";
    link.click();
  }

  function downloadPdf() {
    if (!selection) return;
    const blob = selectedTimePdfBlob(date, selection, zones, anchorTimeZone, locale);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timegrid-meeting.pdf";
    link.click();
    URL.revokeObjectURL(url);
  }

  function shareCardText() {
    if (!selection) return shareUrl;
    return `${teamsSummary(date, selection, zones, anchorTimeZone, locale)}\n\nOpen this TimeGrid view:\n${shareUrl}`;
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft" aria-labelledby="selection-title">
      <h2 id="selection-title" className="text-sm font-semibold">
        Selected time
      </h2>
      {selection ? (
        <>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
            {summary}
          </pre>
          <div className="mt-3 grid gap-2 rounded-md border border-border bg-background p-3 text-sm sm:grid-cols-[1fr_auto]">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repeat</span>
              <select
                value={recurrence.frequency}
                onChange={(event) =>
                  setRecurrence((current) => ({ ...current, frequency: event.target.value as RecurrenceFrequency }))
                }
                className="h-10 rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occurrences</span>
              <input
                type="number"
                min={2}
                max={999}
                value={recurrence.count}
                disabled={recurrence.frequency === "none"}
                onChange={(event) =>
                  setRecurrence((current) => ({
                    ...current,
                    count: Math.max(2, Math.min(999, Number(event.target.value) || 2))
                  }))
                }
                className="h-10 w-28 rounded-md border border-border bg-card px-3 outline-none disabled:opacity-50 focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
          {fairnessRotation.length > 0 ? (
            <div className="mt-3 rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fairness rotation</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Suggested recurring slots that spread off-hours load across the team.</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                  {fairnessRotation.length} slots
                </span>
              </div>
              <div className="grid gap-2">
                {fairnessRotation.map((slot) => {
                  const start = baseMinuteToUtc(slot.date, slot.startMinute, anchorTimeZone);
                  const end = baseMinuteToUtc(slot.date, slot.endMinute, anchorTimeZone);
                  const hardestEntry = Object.entries(slot.cumulativePain).sort((a, b) => b[1] - a[1])[0];
                  const hardestZone = zones.find((zone) => zone.id === hardestEntry?.[0]);

                  return (
                    <button
                      key={`${slot.occurrence}-${slot.date}-${slot.startMinute}`}
                      type="button"
                      disabled={!onSelect}
                      onClick={() => onSelect?.({ startMinute: slot.startMinute, endMinute: slot.endMinute }, slot.date)}
                      className="grid gap-1 rounded-md border border-border bg-card p-3 text-left transition hover:border-primary/60 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="text-sm font-semibold">
                        #{slot.occurrence} · {formatClockTime(start, anchorTimeZone, "12h")}-{formatClockTime(end, anchorTimeZone, "12h")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {slot.date} · hardest cumulative load: {hardestZone?.label ?? "Team"} ({hardestEntry?.[1] ?? 0})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => copyText(summary)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Clipboard className="h-4 w-4" />
              Copy summary
            </button>
            <a
              href={googleCalendarUrl(date, selection, zones, anchorTimeZone, locale, activeRecurrence)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <CalendarPlus className="h-4 w-4" />
              Google Calendar
            </a>
            <a
              href={outlookCalendarUrl(date, selection, zones, anchorTimeZone, locale)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <CalendarPlus className="h-4 w-4" />
              Outlook
            </a>
            <button
              type="button"
              onClick={downloadIcs}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Download className="h-4 w-4" />
              Download .ics
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={downloadPng}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => copyText(slackSummary(date, selection, zones, anchorTimeZone, locale))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <MessageSquareText className="h-4 w-4" />
              Copy Slack
            </button>
            <button
              type="button"
              onClick={() => copyText(teamsSummary(date, selection, zones, anchorTimeZone, locale))}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <MessageSquareText className="h-4 w-4" />
              Copy Teams
            </button>
            <button
              type="button"
              onClick={() => copyText(shareUrl)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <LinkIcon className="h-4 w-4" />
              Copy share link
            </button>
            <button
              type="button"
              onClick={() => copyText(shareCardText())}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Clipboard className="h-4 w-4" />
              Copy share card
            </button>
          </div>
          <div className="mt-4 rounded-md border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participant pain map</h3>
              <span className="text-xs text-muted-foreground">Lower is better</span>
            </div>
            <div className="grid gap-2">
              {pains.map((pain) => {
                const instant = baseMinuteToUtc(date, selection.startMinute + (selection.endMinute - selection.startMinute) / 2, anchorTimeZone);
                return (
                  <div key={pain.zoneId} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">{pain.label}</span>
                        {pain.flexible ? (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            flexible
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatClockTime(instant, zones.find((zone) => zone.id === pain.zoneId)?.timeZone ?? anchorTimeZone, "12h")}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-bold capitalize",
                        pain.kind === "work" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                        pain.kind === "off" && "bg-amber-500/20 text-amber-800 dark:text-amber-200",
                        pain.kind === "break" && "bg-sky-500/15 text-sky-700 dark:text-sky-200",
                        pain.kind === "weekend" && "bg-purple-500/15 text-purple-700 dark:text-purple-200",
                        pain.kind === "night" && "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      )}
                    >
                      {pain.kind} · {pain.pain}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
          Pick a recommended time or drag across the grid to create a meeting range.
        </div>
      )}
    </section>
  );
}

"use client";

import { Download, Gauge, SlidersHorizontal } from "lucide-react";
import type { SchedulingRules, WorkingHours, ZoneEntry } from "@/types";

type SettingsPanelProps = {
  workingHours: WorkingHours;
  schedulingRules: SchedulingRules;
  compact: boolean;
  timeFormat: "12h" | "24h";
  rowSort: "custom" | "name" | "offset" | "localTime";
  timelineZoom: "12h" | "24h" | "3d" | "week";
  weekStartsOn: 0 | 1 | 6;
  locale: string;
  zones: ZoneEntry[];
  onWorkingHoursChange: (hours: WorkingHours) => void;
  onSchedulingRulesChange: (rules: SchedulingRules) => void;
  onCompactChange: (compact: boolean) => void;
  onTimeFormatChange: (format: "12h" | "24h") => void;
  onRowSortChange: (sort: "custom" | "name" | "offset" | "localTime") => void;
  onTimelineZoomChange: (zoom: "12h" | "24h" | "3d" | "week") => void;
  onWeekStartsOnChange: (day: 0 | 1 | 6) => void;
  onLocaleChange: (locale: string) => void;
};

export function SettingsPanel({
  workingHours,
  schedulingRules,
  compact,
  timeFormat,
  rowSort,
  timelineZoom,
  weekStartsOn,
  locale,
  zones,
  onWorkingHoursChange,
  onSchedulingRulesChange,
  onCompactChange,
  onTimeFormatChange,
  onRowSortChange,
  onTimelineZoomChange,
  onWeekStartsOnChange,
  onLocaleChange
}: SettingsPanelProps) {
  function exportJson() {
    const blob = new Blob([JSON.stringify(zones, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timegrid-zones.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft" aria-labelledby="settings-title">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <h2 id="settings-title" className="text-sm font-semibold">
          Settings
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Work starts</span>
          <input
            type="number"
            min={0}
            max={23}
            value={workingHours.start}
            onChange={(event) => onWorkingHoursChange({ ...workingHours, start: Number(event.target.value) })}
            className="h-10 rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Work ends</span>
          <input
            type="number"
            min={1}
            max={24}
            value={workingHours.end}
            onChange={(event) => onWorkingHoursChange({ ...workingHours, end: Number(event.target.value) })}
            className="h-10 rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={compact}
            onChange={(event) => onCompactChange(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="inline-flex items-center gap-2 font-medium">
            <Gauge className="h-4 w-4" />
            Compact rows
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={schedulingRules.avoidWeekends}
            onChange={(event) => onSchedulingRulesChange({ ...schedulingRules, avoidWeekends: event.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          <span className="font-medium">Avoid weekends</span>
        </label>
        <div className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Time format</span>
          <div className="grid grid-cols-2 rounded-md border border-border bg-background p-1">
            {(["24h", "12h"] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => onTimeFormatChange(format)}
                className={`h-8 rounded text-sm font-semibold transition ${
                  timeFormat === format ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Sort rows</span>
          <select
            value={rowSort}
            onChange={(event) => onRowSortChange(event.target.value as "custom" | "name" | "offset" | "localTime")}
            className="h-10 rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="custom">Custom</option>
            <option value="name">Name</option>
            <option value="offset">Offset</option>
            <option value="localTime">Local time</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Timeline</span>
          <select
            value={timelineZoom}
            onChange={(event) => onTimelineZoomChange(event.target.value as "12h" | "24h" | "3d" | "week")}
            className="h-10 rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="12h">12 hours</option>
            <option value="24h">24 hours</option>
            <option value="3d">3 days</option>
            <option value="week">Week</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Week starts</span>
          <select
            value={weekStartsOn}
            onChange={(event) => onWeekStartsOnChange(Number(event.target.value) as 0 | 1 | 6)}
            className="h-10 rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
            <option value={6}>Saturday</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Locale</span>
          <select
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="en-CA">English (Canada)</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="es-ES">Spanish</option>
            <option value="ja-JP">Japanese</option>
          </select>
        </label>
        <button
          type="button"
          onClick={exportJson}
          className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Download className="h-4 w-4" />
          Export zones
        </button>
      </div>
    </section>
  );
}

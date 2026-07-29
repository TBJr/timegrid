"use client";

import { ArrowDown, ArrowUp, GripVertical, Home, Lock, Pin, Star, Trash2, Unlock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  baseMinuteToUtc,
  classifyAvailability,
  dayDelta,
  formatClockTime,
  formatDayShort,
  formatHourNumber,
  formatMonthDayShort,
  formatTime,
  getCurrentMinuteOfBaseDay,
  getLocalMinute,
  getTimeZoneOffsetMs,
  normalizeSelection,
  qualityFromScore,
  relativeTimeZoneOffsetLabel,
  scoreMinute,
  timeZoneAbbreviation
} from "@/lib/time-utils";
import { metadataForTimeZone } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import type { SchedulingRules, SelectionRange, WorkingHours, ZoneEntry } from "@/types";

type TimeGridProps = {
  date: string;
  zones: ZoneEntry[];
  workingHours: WorkingHours;
  schedulingRules: SchedulingRules;
  selection: SelectionRange | null;
  compact: boolean;
  timeFormat: "12h" | "24h";
  timelineZoom: "12h" | "24h" | "3d" | "week";
  locale: string;
  readOnly?: boolean;
  rowSort: "custom" | "name" | "offset" | "localTime";
  onSelectionChange: (selection: SelectionRange) => void;
  onZonesChange: (zones: ZoneEntry[]) => void;
};

const MINUTE_WIDTH = 1;
const HOUR_WIDTH = MINUTE_WIDTH * 60;
const TRACK_PADDING = 16;
const ROW_HEIGHT = {
  normal: "min-h-[6.75rem]",
  compact: "min-h-[5.25rem]"
};

export function TimeGrid({
  date,
  zones,
  workingHours,
  schedulingRules,
  selection,
  compact,
  timeFormat,
  timelineZoom,
  locale,
  readOnly = false,
  rowSort,
  onSelectionChange,
  onZonesChange
}: TimeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const anchorTimeZone = zones[0]?.timeZone ?? "UTC";
  const currentMinute = mounted ? getCurrentMinuteOfBaseDay(date, anchorTimeZone) : null;
  const dayCount = timelineZoom === "week" ? 7 : timelineZoom === "3d" ? 3 : 1;
  const hourStart = timelineZoom === "12h" ? 6 : 0;
  const hoursPerDay = timelineZoom === "12h" ? 12 : 24;
  const totalHours = dayCount * hoursPerDay;
  const timelineWidth = totalHours * HOUR_WIDTH;
  const gridWidth = timelineWidth + TRACK_PADDING * 2;
  const canSelectOnTimeline = dayCount === 1;
  const visibleStartMinute = hourStart * 60;
  const visibleEndMinute = (hourStart + hoursPerDay) * 60;
  const currentMinuteInView =
    currentMinute !== null && currentMinute >= visibleStartMinute && currentMinute <= visibleEndMinute
      ? currentMinute - visibleStartMinute
      : null;
  const selectionInView =
    selection && canSelectOnTimeline && selection.endMinute > visibleStartMinute && selection.startMinute < visibleEndMinute
      ? {
          start: Math.max(selection.startMinute, visibleStartMinute) - visibleStartMinute,
          end: Math.min(selection.endMinute, visibleEndMinute) - visibleStartMinute
        }
      : null;
  const offsetInstant = baseMinuteToUtc(date, 12 * 60, anchorTimeZone);
  const displayZones = useMemo(() => {
    if (zones.length <= 1) return zones;
    const home = zones[0];
    const rest = zones.slice(1).map((zone, originalIndex) => ({ zone, originalIndex: originalIndex + 1 }));
    const sortEntries = (entries: typeof rest) => [...entries].sort((a, b) => {
      if (a.zone.pinned !== b.zone.pinned) return a.zone.pinned ? -1 : 1;
      if (rowSort === "name") return a.zone.label.localeCompare(b.zone.label);
      if (rowSort === "offset") {
        return getTimeZoneOffsetMs(offsetInstant, a.zone.timeZone) - getTimeZoneOffsetMs(offsetInstant, b.zone.timeZone);
      }
      if (rowSort === "localTime") {
        return getLocalMinute(offsetInstant, a.zone.timeZone) - getLocalMinute(offsetInstant, b.zone.timeZone);
      }
      return a.originalIndex - b.originalIndex;
    });
    const frozen = sortEntries(rest.filter((entry) => entry.zone.frozen));
    const movable = sortEntries(rest.filter((entry) => !entry.zone.frozen));
    return [home, ...frozen.map((entry) => entry.zone), ...movable.map((entry) => entry.zone)];
  }, [offsetInstant, rowSort, zones]);
  const frozenIndexes = useMemo(() => {
    let rank = 0;
    return new Map(displayZones.map((zone, index) => [zone.id, index === 0 || zone.frozen ? rank++ : -1]));
  }, [displayZones]);
  const overlapScores = useMemo(
    () =>
      Array.from({ length: totalHours }, (_, index) => {
        const dayOffset = Math.floor(index / hoursPerDay);
        const hour = hourStart + (index % hoursPerDay);
        return scoreMinute(addDays(date, dayOffset), hour * 60 + 30, zones, workingHours, anchorTimeZone, schedulingRules);
      }),
    [anchorTimeZone, date, hourStart, hoursPerDay, schedulingRules, totalHours, zones, workingHours]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  function minuteFromPointer(clientX: number, timeline: HTMLElement) {
    const rect = timeline.getBoundingClientRect();
    return Math.max(0, Math.min(hoursPerDay * 60, (clientX - rect.left - TRACK_PADDING) / MINUTE_WIDTH));
  }

  function moveZone(index: number, direction: -1 | 1) {
    const next = [...zones];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onZonesChange(next);
  }

  function renameZone(id: string, label: string) {
    onZonesChange(zones.map((zone) => (zone.id === id ? { ...zone, label } : zone)));
  }

  function removeZone(id: string) {
    onZonesChange(zones.filter((zone) => zone.id !== id));
  }

  function updateZone(id: string, patch: Partial<ZoneEntry>) {
    onZonesChange(zones.map((zone) => (zone.id === id ? { ...zone, ...patch } : zone)));
  }

  function setHome(index: number) {
    if (index === 0) return;
    const next = [...zones];
    const [home] = next.splice(index, 1);
    next.unshift(home);
    onZonesChange(next);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-soft" aria-labelledby="grid-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 id="grid-title" className="text-base font-semibold">
            Time grid
          </h2>
          <p className="text-xs text-muted-foreground">
            {readOnly ? "Read-only shared view. Copy or export the selected meeting window." : "Drag across the hours to choose a meeting window."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-700 dark:text-emerald-300">Working</span>
          <span className="rounded-full bg-slate-500/15 px-2 py-1 text-slate-700 dark:text-slate-300">Night</span>
          <span className="rounded-full bg-primary/15 px-2 py-1 text-primary">Selected</span>
        </div>
      </div>
      <div className="timegrid-scrollbar overflow-x-auto" ref={gridRef}>
        <div style={{ minWidth: `calc(22rem + ${gridWidth}px)` }}>
          <div
            className="sticky top-0 z-20 grid border-b border-border bg-card"
            style={{ gridTemplateColumns: `22rem ${gridWidth}px` }}
          >
            <div className="sticky left-0 z-30 border-r border-border bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Place</p>
              <p className="mt-1 text-xs text-muted-foreground">Local clock and date</p>
            </div>
            <div className="relative px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-md bg-primary/12 px-3 py-1.5 text-center text-xs font-bold text-primary">
                  <span className="block uppercase">{formatDayShort(baseMinuteToUtc(date, 0, anchorTimeZone), anchorTimeZone, locale)}</span>
                  <span className="block">{formatMonthDayShort(baseMinuteToUtc(date, 0, anchorTimeZone), anchorTimeZone, locale)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Timeline anchored to <span className="font-semibold text-foreground">{zones[0]?.label ?? "UTC"}</span>
                </div>
              </div>
              <div className="relative flex overflow-hidden rounded-xl border border-border bg-background">
              {Array.from({ length: totalHours }, (_, index) => {
                const dayOffset = Math.floor(index / hoursPerDay);
                const hour = hourStart + (index % hoursPerDay);
                const slotDate = addDays(date, dayOffset);
                const quality = qualityFromScore(overlapScores[index], zones.length);
                const showDayLabel = dayCount > 1 && index % hoursPerDay === 0;
                return (
                  <div
                    key={`${slotDate}-${hour}`}
                    className={cn(
                      "flex h-10 flex-col items-center justify-center border-r border-border text-sm font-semibold last:border-r-0",
                      quality === "great" && "bg-emerald-500/10",
                      quality === "okay" && "bg-amber-500/10",
                      quality === "bad" && "bg-rose-500/10"
                    )}
                    style={{ width: HOUR_WIDTH }}
                    title={`${String(hour).padStart(2, "0")}:00 - ${quality} overlap`}
                  >
                    {showDayLabel ? (
                      <span className="text-[10px] font-bold uppercase leading-none text-primary">
                        {formatMonthDayShort(baseMinuteToUtc(slotDate, 0, anchorTimeZone), anchorTimeZone, locale)}
                      </span>
                    ) : null}
                    <span>{hour}</span>
                  </div>
                );
              })}
              {currentMinuteInView !== null && dayCount === 1 ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-destructive"
                  style={{ left: currentMinuteInView * MINUTE_WIDTH }}
                  aria-hidden="true"
                />
              ) : null}
              </div>
            </div>
          </div>

          {displayZones.map((zone, index) => {
            const sourceIndex = zones.findIndex((entry) => entry.id === zone.id);
            const frozenRank = frozenIndexes.get(zone.id) ?? -1;
            const rowFrozen = frozenRank >= 0;
            const fallbackMetadata = metadataForTimeZone(zone.timeZone);
            const metadata = {
              country: zone.country ?? fallbackMetadata.country,
              countryCode: zone.countryCode ?? fallbackMetadata.countryCode,
              region: zone.region ?? fallbackMetadata.region
            };
            return (
            <div
              key={zone.id}
              className={cn(
                "grid border-b border-border last:border-b-0",
                rowFrozen && "sticky z-10 shadow-[0_12px_24px_rgb(15_23_42_/_0.08)]",
                compact ? ROW_HEIGHT.compact : ROW_HEIGHT.normal
              )}
              style={{
                gridTemplateColumns: `22rem ${gridWidth}px`,
                top: rowFrozen ? `${88 + frozenRank * (compact ? 84 : 108)}px` : undefined
              }}
            >
              <div
                className={cn(
                  "sticky left-0 z-10 flex items-center gap-3 border-r border-border bg-card px-4 py-3",
                  rowFrozen && "bg-card"
                )}
              >
                <div className="flex w-5 shrink-0 flex-col items-center gap-1 text-muted-foreground">
                  {index === 0 ? (
                    <Home className="h-4 w-4 text-foreground" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setHome(index)}
                      disabled={readOnly}
                      className="rounded px-1 text-sm font-bold hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      title={`Make ${zone.label} the home row`}
                      aria-label={`Make ${zone.label} the home row`}
                    >
                      {relativeTimeZoneOffsetLabel(offsetInstant, anchorTimeZone, zone.timeZone)}
                    </button>
                  )}
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <input
                      value={zone.label}
                      onChange={(event) => renameZone(zone.id, event.target.value)}
                      readOnly={readOnly}
                      className="min-w-0 flex-1 truncate rounded bg-transparent text-xl font-bold outline-none focus:bg-muted focus:px-1"
                      aria-label={`Rename ${zone.label}`}
                    />
                    <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {timeZoneAbbreviation(baseMinuteToUtc(date, 12 * 60, anchorTimeZone), zone.timeZone)}
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="truncate">{zone.city}</span>
                    {metadata.countryCode ? (
                      <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold leading-none">
                        {metadata.countryCode}
                      </span>
                    ) : null}
                    {metadata.region ? (
                      <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                        {metadata.region}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <p className="text-2xl font-bold tabular-nums" suppressHydrationWarning>
                    {mounted ? formatClockTime(new Date(), zone.timeZone, timeFormat) : "--:--"}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                    {mounted ? formatMonthDayShort(new Date(), zone.timeZone, locale) : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateZone(zone.id, { pinned: !zone.pinned })}
                    disabled={readOnly}
                    className={cn("rounded p-1 hover:bg-muted", zone.pinned ? "text-primary" : "text-muted-foreground")}
                    aria-label={zone.pinned ? `Unpin ${zone.label}` : `Pin ${zone.label}`}
                    title={zone.pinned ? "Remove sort pin" : "Pin for sorting"}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!readOnly && index !== 0) updateZone(zone.id, { frozen: !zone.frozen });
                    }}
                    disabled={readOnly || index === 0}
                    className={cn(
                      "rounded p-1 hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent",
                      index === 0 || zone.frozen ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-label={index === 0 ? `${zone.label} is the fixed home row` : zone.frozen ? `Unfreeze ${zone.label}` : `Freeze ${zone.label}`}
                    title={index === 0 ? "Home row stays frozen" : zone.frozen ? "Unfreeze row" : "Freeze row at top"}
                  >
                    {index === 0 || zone.frozen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateZone(zone.id, { favorite: !zone.favorite })}
                    disabled={readOnly}
                    className={cn("rounded p-1 hover:bg-muted", zone.favorite ? "text-accent" : "text-muted-foreground")}
                    aria-label={zone.favorite ? `Unfavorite ${zone.label}` : `Favorite ${zone.label}`}
                    title={zone.favorite ? "Remove favorite" : "Favorite"}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveZone(sourceIndex, -1)}
                    disabled={readOnly || sourceIndex <= 0 || rowSort !== "custom"}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label={`Move ${zone.label} up`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveZone(sourceIndex, 1)}
                    disabled={readOnly || sourceIndex === zones.length - 1 || rowSort !== "custom"}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label={`Move ${zone.label} down`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeZone(zone.id)}
                    disabled={readOnly}
                    className="rounded p-1 text-destructive hover:bg-muted"
                    aria-label={`Remove ${zone.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div
                className="relative grid touch-pan-x select-none gap-2 px-4 py-3"
                onPointerDown={(event) => {
                  if (readOnly || !canSelectOnTimeline) return;
                  const minute = minuteFromPointer(event.clientX, event.currentTarget) + visibleStartMinute;
                  setDragStart(minute);
                  onSelectionChange(normalizeSelection(minute, minute + 15));
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (dragStart === null) return;
                  if (readOnly) return;
                  onSelectionChange(normalizeSelection(dragStart, minuteFromPointer(event.clientX, event.currentTarget) + visibleStartMinute));
                }}
                onPointerUp={() => setDragStart(null)}
                role="grid"
                aria-label={`${zone.label} timeline${canSelectOnTimeline ? "" : " preview"}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                    <span className="font-medium text-muted-foreground">Start</span>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={(zone.workingHours ?? workingHours).start}
                      onPointerDown={(event) => event.stopPropagation()}
                      disabled={readOnly}
                      onChange={(event) =>
                        updateZone(zone.id, {
                          workingHours: { ...(zone.workingHours ?? workingHours), start: Number(event.target.value) }
                        })
                      }
                      className="w-10 bg-transparent font-semibold outline-none"
                      aria-label={`${zone.label} working day starts`}
                    />
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                    <span className="font-medium text-muted-foreground">End</span>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={(zone.workingHours ?? workingHours).end}
                      onPointerDown={(event) => event.stopPropagation()}
                      disabled={readOnly}
                      onChange={(event) =>
                        updateZone(zone.id, {
                          workingHours: { ...(zone.workingHours ?? workingHours), end: Number(event.target.value) }
                        })
                      }
                      className="w-10 bg-transparent font-semibold outline-none"
                      aria-label={`${zone.label} working day ends`}
                    />
                  </label>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => updateZone(zone.id, { flexible: !zone.flexible })}
                    disabled={readOnly}
                    className={cn(
                      "rounded-md border border-border px-2 py-1 font-semibold transition",
                      zone.flexible ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-background text-muted-foreground"
                    )}
                    aria-pressed={Boolean(zone.flexible)}
                  >
                    {zone.flexible ? "Flexible" : "Fixed"}
                  </button>
                  {zone.workingHours ? (
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => updateZone(zone.id, { workingHours: undefined })}
                      disabled={readOnly}
                      className="rounded-md px-2 py-1 font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Use global hours
                    </button>
                  ) : null}
                  {zone.breakWindow ? (
                    <>
                      <label className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                        <span className="font-medium text-muted-foreground">Break</span>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={zone.breakWindow.start}
                          onPointerDown={(event) => event.stopPropagation()}
                          disabled={readOnly}
                          onChange={(event) =>
                            updateZone(zone.id, {
                              breakWindow: { ...(zone.breakWindow ?? { start: 12, end: 13 }), start: Number(event.target.value) }
                            })
                          }
                          className="w-10 bg-transparent font-semibold outline-none"
                          aria-label={`${zone.label} break starts`}
                        />
                        <span className="text-muted-foreground">to</span>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={zone.breakWindow.end}
                          onPointerDown={(event) => event.stopPropagation()}
                          disabled={readOnly}
                          onChange={(event) =>
                            updateZone(zone.id, {
                              breakWindow: { ...(zone.breakWindow ?? { start: 12, end: 13 }), end: Number(event.target.value) }
                            })
                          }
                          className="w-10 bg-transparent font-semibold outline-none"
                          aria-label={`${zone.label} break ends`}
                        />
                      </label>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => updateZone(zone.id, { breakWindow: undefined })}
                        disabled={readOnly}
                        className="rounded-md px-2 py-1 font-semibold text-muted-foreground hover:bg-muted"
                      >
                        Remove break
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => updateZone(zone.id, { breakWindow: { start: 12, end: 13 } })}
                      disabled={readOnly}
                      className="rounded-md border border-border bg-background px-2 py-1 font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Add break
                    </button>
                  )}
                </div>
                <div className="relative flex overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                  {Array.from({ length: totalHours }, (_, cellIndex) => {
                    const dayOffset = Math.floor(cellIndex / hoursPerDay);
                    const hour = hourStart + (cellIndex % hoursPerDay);
                    const slotDate = addDays(date, dayOffset);
                    const utc = baseMinuteToUtc(slotDate, hour * 60, anchorTimeZone);
                    const localMinute = getLocalMinute(utc, zone.timeZone);
                    const kind = classifyAvailability(utc, zone, workingHours, schedulingRules);
                    const delta = dayDelta(date, utc, zone.timeZone);
                    const previousIndex = cellIndex - 1;
                    const previousUtc =
                      previousIndex >= 0
                        ? baseMinuteToUtc(
                            addDays(date, Math.floor(previousIndex / hoursPerDay)),
                            (hourStart + (previousIndex % hoursPerDay)) * 60,
                            anchorTimeZone
                          )
                        : null;
                    const showDateLabel =
                      previousUtc === null ||
                      formatMonthDayShort(previousUtc, zone.timeZone, locale) !== formatMonthDayShort(utc, zone.timeZone, locale);
                    return (
                      <div
                        key={`${slotDate}-${hour}`}
                        className={cn(
                          "relative h-14 border-r border-border last:border-r-0",
                          delta !== 0
                            ? "grid grid-rows-[1fr_auto] grid-cols-1"
                            : "flex flex-col items-center justify-center gap-0.5",
                          kind === "work" && "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
                          kind === "break" && "bg-sky-500/15 text-sky-700 dark:text-sky-200",
                          kind === "night" && "bg-slate-600/20 text-muted-foreground",
                          kind === "off" && "bg-sky-500/10 text-slate-500 dark:text-slate-300"
                        )}
                        style={{ width: HOUR_WIDTH }}
                        title={`${zone.label}: ${formatTime(utc, zone.timeZone, locale)}`}
                      >
                        <div className="flex min-h-0 flex-col items-center justify-center gap-0.5">
                          {showDateLabel ? (
                            <span className="rounded bg-primary/15 px-1 py-0.5 text-[10px] font-bold uppercase leading-none text-primary">
                              {formatMonthDayShort(utc, zone.timeZone, locale)}
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "text-2xl font-semibold tabular-nums",
                              showDateLabel && "text-xl leading-none"
                            )}
                          >
                            {formatHourNumber(utc, zone.timeZone, timeFormat)}
                          </span>
                        </div>
                        {delta !== 0 ? (
                          <span className="justify-self-end pb-0.5 pr-0.5 text-[10px] font-bold leading-none text-accent-foreground">
                            <span className="rounded bg-accent/20 px-0.5">{delta > 0 ? `+${delta}` : delta}</span>
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {selectionInView ? (
                  <div
                    className="pointer-events-none absolute inset-y-4 z-10 rounded-md border-2 border-slate-950 bg-primary/15 shadow-[0_0_0_9999px_rgb(15_23_42_/_0.02)] dark:border-white"
                    style={{
                      left: TRACK_PADDING + selectionInView.start * MINUTE_WIDTH,
                      width: (selectionInView.end - selectionInView.start) * MINUTE_WIDTH
                    }}
                  />
                ) : null}
                {currentMinuteInView !== null && dayCount === 1 ? (
                  <div
                    className="pointer-events-none absolute inset-y-3 z-20 w-0.5 bg-destructive"
                    style={{ left: TRACK_PADDING + currentMinuteInView * MINUTE_WIDTH }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
          );
          })}
        </div>
      </div>
      {zones.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Add a city to start comparing time zones.</div>
      ) : null}
    </section>
  );
}

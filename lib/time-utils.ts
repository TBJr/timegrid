import type { FairnessRotationSlot, MeetingSlot, OverlapQuality, ParticipantPain, SchedulingRules, SelectionRange, WorkingHours, ZoneEntry } from "@/types";

type TimeFormat = "12h" | "24h";
type WeekStartsOn = 0 | 1 | 6;

function partsFor(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const hour = get("hour");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: hour === 24 ? 0 : hour,
    minute: get("minute")
  };
}

const DEFAULT_SCHEDULING_RULES: SchedulingRules = {
  avoidWeekends: false
};

export function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateIso: string, days: number) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function startOfWeek(dateIso: string, weekStartsOn: WeekStartsOn) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const diff = (date.getUTCDay() - weekStartsOn + 7) % 7;
  return addDays(dateIso, -diff);
}

export function dateLabel(dateIso: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${dateIso}T12:00:00Z`));
}

export function dateWeekdayShort(dateIso: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short"
  }).format(new Date(`${dateIso}T12:00:00Z`));
}

export function dateMonthDay(dateIso: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateIso}T12:00:00Z`));
}

export function formatTime(date: Date, timeZone: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatClockTime(date: Date, timeZone: string, timeFormat: TimeFormat) {
  return new Intl.DateTimeFormat(timeFormat === "24h" ? "en-GB" : "en-US", {
    timeZone,
    hour: timeFormat === "24h" ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: timeFormat === "12h"
  }).format(date);
}

export function formatHourNumber(date: Date, timeZone: string, timeFormat: TimeFormat) {
  const { hour } = partsFor(date, timeZone);
  if (timeFormat === "24h") {
    return String(hour).padStart(2, "0");
  }
  const h12 = hour % 12 || 12;
  return `${h12}${hour < 12 ? "AM" : "PM"}`;
}

export function formatDayShort(date: Date, timeZone: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short"
  }).format(date);
}

export function formatMonthDayShort(date: Date, timeZone: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric"
  }).format(date);
}

export function timeZoneAbbreviation(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short"
  }).formatToParts(date);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

export function formatDateInZone(date: Date, timeZone: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

export function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = partsFor(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return asUtc - date.getTime();
}

export function relativeTimeZoneOffsetLabel(date: Date, homeTimeZone: string, targetTimeZone: string) {
  const diffMinutes = Math.round((getTimeZoneOffsetMs(date, targetTimeZone) - getTimeZoneOffsetMs(date, homeTimeZone)) / 60_000);
  if (diffMinutes === 0) return "+0";
  const sign = diffMinutes > 0 ? "+" : "-";
  const abs = Math.abs(diffMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return minutes === 0 ? `${sign}${hours}` : `${sign}${hours}:${String(minutes).padStart(2, "0")}`;
}

export function zonedTimeToUtc(dateIso: string, minutes: number, timeZone: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const wallClockAsUtc = new Date(Date.UTC(year, month - 1, day, 0, minutes));
  let utc = new Date(wallClockAsUtc.getTime() - getTimeZoneOffsetMs(wallClockAsUtc, timeZone));

  // DST transitions can make the first offset estimate stale. A second pass
  // resolves the target wall-clock minute against the offset active at that instant.
  utc = new Date(wallClockAsUtc.getTime() - getTimeZoneOffsetMs(utc, timeZone));
  return utc;
}

export function baseMinuteToUtc(dateIso: string, minute: number, anchorTimeZone = "UTC") {
  return zonedTimeToUtc(dateIso, minute, anchorTimeZone);
}

export function getLocalMinute(date: Date, timeZone: string) {
  const parts = partsFor(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

export function getLocalWeekday(date: Date, timeZone: string) {
  const parts = partsFor(date, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function dayDelta(baseDateIso: string, date: Date, timeZone: string) {
  const local = partsFor(date, timeZone);
  const localDate = Date.UTC(local.year, local.month - 1, local.day);
  const [year, month, day] = baseDateIso.split("-").map(Number);
  const baseDate = Date.UTC(year, month - 1, day);
  return Math.round((localDate - baseDate) / 86_400_000);
}

export function getCurrentMinuteOfBaseDay(dateIso: string, anchorTimeZone = "UTC") {
  const now = new Date();
  const anchor = partsFor(now, anchorTimeZone);
  const anchorDate = `${anchor.year}-${String(anchor.month).padStart(2, "0")}-${String(anchor.day).padStart(2, "0")}`;
  if (anchorDate !== dateIso) return null;
  return anchor.hour * 60 + anchor.minute;
}

export function classifyLocalHour(localMinute: number, workingHours: WorkingHours) {
  const hour = localMinute / 60;
  if (hour >= workingHours.start && hour < workingHours.end) return "work";
  if (hour < 7 || hour >= 22) return "night";
  return "off";
}

export function workingHoursForZone(zone: ZoneEntry, fallback: WorkingHours) {
  return zone.workingHours ?? fallback;
}

function isWithinWindow(localMinute: number, window: WorkingHours) {
  const hour = localMinute / 60;
  return hour >= window.start && hour < window.end;
}

export function classifyAvailability(
  date: Date,
  zone: ZoneEntry,
  workingHours: WorkingHours,
  schedulingRules: SchedulingRules = DEFAULT_SCHEDULING_RULES
) {
  const localMinute = getLocalMinute(date, zone.timeZone);
  const weekday = getLocalWeekday(date, zone.timeZone);
  if (schedulingRules.avoidWeekends && (weekday === 0 || weekday === 6)) return "weekend";
  if (zone.breakWindow && isWithinWindow(localMinute, zone.breakWindow)) return "break";
  return classifyLocalHour(localMinute, workingHoursForZone(zone, workingHours));
}

export function scoreMinute(
  dateIso: string,
  minute: number,
  zones: ZoneEntry[],
  workingHours: WorkingHours,
  anchorTimeZone = "UTC",
  schedulingRules: SchedulingRules = DEFAULT_SCHEDULING_RULES
) {
  return zones.reduce((score, zone) => {
    const utc = baseMinuteToUtc(dateIso, minute, anchorTimeZone);
    const kind = classifyAvailability(utc, zone, workingHours, schedulingRules);
    const flexibilityBonus = zone.flexible ? 1 : 0;
    if (kind === "work") return score + 2 + flexibilityBonus;
    if (kind === "off") return score + 1;
    if (kind === "break") return zone.flexible ? score : score - 1;
    if (kind === "weekend") return zone.flexible ? score - 2 : score - 4;
    return zone.flexible ? score - 1 : score - 2;
  }, 0);
}

export function participantPainAt(
  dateIso: string,
  minute: number,
  zone: ZoneEntry,
  workingHours: WorkingHours,
  anchorTimeZone = "UTC",
  schedulingRules: SchedulingRules = DEFAULT_SCHEDULING_RULES
): ParticipantPain {
  const utc = baseMinuteToUtc(dateIso, minute, anchorTimeZone);
  const localMinute = getLocalMinute(utc, zone.timeZone);
  const kind = classifyAvailability(utc, zone, workingHours, schedulingRules);
  const pain = kind === "work" ? 0 : kind === "off" ? 1 : kind === "break" ? 2 : kind === "weekend" ? 4 : zone.flexible ? 2 : 3;
  return {
    zoneId: zone.id,
    label: zone.label,
    localMinute,
    kind,
    pain,
    flexible: Boolean(zone.flexible)
  };
}

export function participantPainForSelection(
  dateIso: string,
  selection: SelectionRange,
  zones: ZoneEntry[],
  workingHours: WorkingHours,
  anchorTimeZone = "UTC",
  schedulingRules: SchedulingRules = DEFAULT_SCHEDULING_RULES
) {
  const midpoint = selection.startMinute + (selection.endMinute - selection.startMinute) / 2;
  return zones
    .map((zone) => participantPainAt(dateIso, midpoint, zone, workingHours, anchorTimeZone, schedulingRules))
    .sort((a, b) => b.pain - a.pain || a.label.localeCompare(b.label));
}

export function qualityFromScore(score: number, zonesCount: number): OverlapQuality {
  const max = Math.max(1, zonesCount * 2);
  const ratio = score / max;
  if (ratio >= 0.78) return "great";
  if (ratio >= 0.45) return "okay";
  return "bad";
}

export function findBestMeetingSlots(
  dateIso: string,
  zones: ZoneEntry[],
  workingHours: WorkingHours,
  durationMinutes: number,
  limit = 5,
  anchorTimeZone = "UTC",
  schedulingRules: SchedulingRules = DEFAULT_SCHEDULING_RULES
): MeetingSlot[] {
  const step = 15;
  const candidates: MeetingSlot[] = [];
  for (let start = 0; start <= 1440 - durationMinutes; start += step) {
    let score = 0;
    for (let minute = start; minute < start + durationMinutes; minute += step) {
      score += scoreMinute(dateIso, minute, zones, workingHours, anchorTimeZone, schedulingRules);
    }
    candidates.push({
      date: dateIso,
      startMinute: start,
      endMinute: start + durationMinutes,
      score,
      averagePain: 0,
      quality: qualityFromScore(score / Math.max(1, durationMinutes / step), zones.length)
    });
  }

  return candidates
    .map((slot) => {
      const pains = participantPainForSelection(
        dateIso,
        { startMinute: slot.startMinute, endMinute: slot.endMinute },
        zones,
        workingHours,
        anchorTimeZone,
        schedulingRules
      );
      const averagePain = pains.reduce((total, pain) => total + pain.pain, 0) / Math.max(1, pains.length);
      return {
        ...slot,
        averagePain,
        worstParticipant: pains[0]?.pain ? pains[0].label : undefined
      };
    })
    .sort((a, b) => b.score - a.score || a.startMinute - b.startMinute)
    .slice(0, limit);
}

export function findBestMeetingSlotsAcrossDays(
  dateIso: string,
  days: number,
  zones: ZoneEntry[],
  workingHours: WorkingHours,
  durationMinutes: number,
  limit = 5,
  anchorTimeZone = "UTC",
  schedulingRules: SchedulingRules = DEFAULT_SCHEDULING_RULES
) {
  return Array.from({ length: days }, (_, index) => addDays(dateIso, index))
    .filter((candidateDate) => {
      if (!schedulingRules.avoidWeekends) return true;
      const weekday = getLocalWeekday(baseMinuteToUtc(candidateDate, 12 * 60, anchorTimeZone), anchorTimeZone);
      return weekday !== 0 && weekday !== 6;
    })
    .map((candidateDate) =>
      findBestMeetingSlots(candidateDate, zones, workingHours, durationMinutes, limit, anchorTimeZone, schedulingRules)
    )
    .flat()
    .sort((a, b) => b.score - a.score || a.averagePain - b.averagePain || a.date.localeCompare(b.date) || a.startMinute - b.startMinute)
    .slice(0, limit);
}

function addRecurringDate(dateIso: string, occurrence: number, frequency: "daily" | "weekly" | "biweekly" | "monthly") {
  if (frequency === "daily") return addDays(dateIso, occurrence);
  if (frequency === "weekly") return addDays(dateIso, occurrence * 7);
  if (frequency === "biweekly") return addDays(dateIso, occurrence * 14);
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + occurrence, day));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function findFairRecurringRotation(
  dateIso: string,
  frequency: "daily" | "weekly" | "biweekly" | "monthly",
  occurrences: number,
  zones: ZoneEntry[],
  workingHours: WorkingHours,
  durationMinutes: number,
  anchorTimeZone = "UTC",
  schedulingRules: SchedulingRules = DEFAULT_SCHEDULING_RULES
): FairnessRotationSlot[] {
  const cumulativePain: Record<string, number> = Object.fromEntries(zones.map((zone) => [zone.id, 0]));
  const rotation: FairnessRotationSlot[] = [];
  const total = Math.max(2, Math.min(12, Math.floor(occurrences || 2)));

  for (let occurrence = 0; occurrence < total; occurrence += 1) {
    const occurrenceDate = addRecurringDate(dateIso, occurrence, frequency);
    const candidates = findBestMeetingSlots(
      occurrenceDate,
      zones,
      workingHours,
      durationMinutes,
      18,
      anchorTimeZone,
      schedulingRules
    );
    const ranked = candidates
      .map((slot) => {
        const pains = participantPainForSelection(
          occurrenceDate,
          { startMinute: slot.startMinute, endMinute: slot.endMinute },
          zones,
          workingHours,
          anchorTimeZone,
          schedulingRules
        );
        const nextPain = { ...cumulativePain };
        pains.forEach((pain) => {
          nextPain[pain.zoneId] = (nextPain[pain.zoneId] ?? 0) + pain.pain;
        });
        const values = Object.values(nextPain);
        const spread = Math.max(...values) - Math.min(...values);
        const totalPain = values.reduce((sum, pain) => sum + pain, 0);
        return { slot, pains, nextPain, spread, totalPain };
      })
      .sort((a, b) => a.spread - b.spread || a.totalPain - b.totalPain || b.slot.score - a.slot.score || a.slot.startMinute - b.slot.startMinute);

    const selected = ranked[0];
    if (!selected) continue;
    Object.assign(cumulativePain, selected.nextPain);
    rotation.push({
      ...selected.slot,
      occurrence: occurrence + 1,
      cumulativePain: { ...cumulativePain }
    });
  }

  return rotation;
}

export function normalizeSelection(start: number, end: number): SelectionRange {
  const min = Math.max(0, Math.min(start, end));
  const max = Math.min(1440, Math.max(start, end));
  return {
    startMinute: Math.floor(min / 15) * 15,
    endMinute: Math.max(Math.ceil(max / 15) * 15, Math.floor(min / 15) * 15 + 15)
  };
}

export function formatSelectionSummary(dateIso: string, selection: SelectionRange, zones: ZoneEntry[], anchorTimeZone = "UTC", locale = "en-US") {
  const lines = [`Meeting time: ${dateLabel(dateIso, locale)}`];
  zones.forEach((zone) => {
    const start = baseMinuteToUtc(dateIso, selection.startMinute, anchorTimeZone);
    const end = baseMinuteToUtc(dateIso, selection.endMinute, anchorTimeZone);
    const startDate = formatDateInZone(start, zone.timeZone, locale);
    const endDate = formatDateInZone(end, zone.timeZone, locale);
    const dateSuffix = startDate === endDate ? ` (${startDate})` : ` (${startDate} to ${endDate})`;
    lines.push(`${zone.label}: ${formatTime(start, zone.timeZone, locale)}-${formatTime(end, zone.timeZone, locale)}${dateSuffix}`);
  });
  return lines.join("\n");
}

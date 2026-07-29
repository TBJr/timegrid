import { COMMON_TIME_ZONES, citySearchText, isValidTimeZone, zoneFromCity, zoneFromRawTimeZone } from "@/lib/timezones";
import { addDays, todayIsoDate } from "@/lib/time-utils";
import type { ZoneEntry } from "@/types";

export type ParsedCommand =
  | { type: "addZone"; zone: ZoneEntry }
  | { type: "date"; date: string }
  | { type: "duration"; durationMinutes: number }
  | { type: "timeFormat"; timeFormat: "12h" | "24h" }
  | { type: "toggleSettings" }
  | { type: "avoidWeekends"; avoidWeekends: boolean }
  | { type: "rowSort"; rowSort: "custom" | "name" | "offset" | "localTime" }
  | { type: "focusSearch" };

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function nextWeekdayDate(dayName: string) {
  const today = new Date(`${todayIsoDate()}T12:00:00Z`);
  const target = WEEKDAYS.indexOf(dayName);
  if (target < 0) return null;
  const diff = (target - today.getUTCDay() + 7) % 7 || 7;
  return addDays(todayIsoDate(), diff);
}

function zoneFromText(text: string): ZoneEntry | null {
  const clean = text.trim().replace(/^(add|city|zone|timezone)\s+/i, "");
  if (!clean) return null;
  const found = COMMON_TIME_ZONES.find((entry) => {
    return citySearchText(entry).includes(clean.toLowerCase());
  });
  if (found) {
    return zoneFromCity(found);
  }
  if (isValidTimeZone(clean)) {
    return zoneFromRawTimeZone(clean);
  }
  return null;
}

export function parseCommand(input: string): ParsedCommand | null {
  const raw = input.trim();
  const text = raw.toLowerCase();
  if (!text) return null;

  if (text === "settings" || text === "open settings") return { type: "toggleSettings" };
  if (text === "search" || text === "add place") return { type: "focusSearch" };
  if (text === "today") return { type: "date", date: todayIsoDate() };
  if (text === "tomorrow") return { type: "date", date: addDays(todayIsoDate(), 1) };
  if (text === "yesterday") return { type: "date", date: addDays(todayIsoDate(), -1) };

  const weekday = text.match(/^(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (weekday) {
    const date = nextWeekdayDate(weekday[2]);
    if (date) return { type: "date", date };
  }

  const duration = text.match(/^(duration\s+)?(\d+)\s*(m|min|mins|minutes|h|hr|hour|hours)$/);
  if (duration) {
    const amount = Number(duration[2]);
    const unit = duration[3];
    return { type: "duration", durationMinutes: unit.startsWith("h") ? amount * 60 : amount };
  }

  if (text === "12h" || text === "12 hour" || text === "12-hour") return { type: "timeFormat", timeFormat: "12h" };
  if (text === "24h" || text === "24 hour" || text === "24-hour") return { type: "timeFormat", timeFormat: "24h" };
  if (text === "avoid weekends" || text === "skip weekends") return { type: "avoidWeekends", avoidWeekends: true };
  if (text === "allow weekends" || text === "include weekends") return { type: "avoidWeekends", avoidWeekends: false };

  const sort = text.match(/^sort\s+(custom|name|offset|local time|time)$/);
  if (sort) {
    const value = sort[1] === "time" || sort[1] === "local time" ? "localTime" : sort[1];
    return { type: "rowSort", rowSort: value as "custom" | "name" | "offset" | "localTime" };
  }

  const zoneText = text.startsWith("add ") ? raw.replace(/^add\s+/i, "") : raw;
  const zone = zoneFromText(zoneText);
  return zone ? { type: "addZone", zone } : null;
}

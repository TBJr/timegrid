import type { AppState, AvailabilityPollState, SelectionRange, WorkingHours, ZoneEntry } from "@/types";

export type ShareMode = "edit" | "readOnly";

type EncodedZone = {
  l: string;
  c: string;
  co?: string;
  cc?: string;
  rg?: string;
  z: string;
  f?: boolean;
  wh?: [number, number];
  br?: [number, number];
  fx?: boolean;
  p?: boolean;
  fr?: boolean;
  fav?: boolean;
};

function encodeJson(value: unknown) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(decodeURIComponent(escape(atob(value)))) as T;
}

export function encodeState(state: AppState, mode: ShareMode = "edit") {
  const params = new URLSearchParams();
  if (mode === "readOnly") params.set("view", "readonly");
  params.set(
    "zones",
    encodeJson(
        state.zones.map<EncodedZone>((zone) => ({
          l: zone.label,
          c: zone.city,
          co: zone.country || undefined,
          cc: zone.countryCode || undefined,
          rg: zone.region || undefined,
          z: zone.timeZone,
          f: zone.fixed || undefined,
          wh: zone.workingHours ? [zone.workingHours.start, zone.workingHours.end] : undefined,
          br: zone.breakWindow ? [zone.breakWindow.start, zone.breakWindow.end] : undefined,
          fx: zone.flexible || undefined,
          p: zone.pinned || undefined,
          fr: zone.frozen || undefined,
          fav: zone.favorite || undefined
        }))
    )
  );
  params.set("date", state.date);
  params.set("work", `${state.workingHours.start}-${state.workingHours.end}`);
  if (state.schedulingRules.avoidWeekends) params.set("avoidWeekends", "1");
  params.set("dur", String(state.durationMinutes));
  if (state.compact) params.set("compact", "1");
  params.set("fmt", state.timeFormat);
  if (state.rowSort !== "custom") params.set("sort", state.rowSort);
  if (state.timelineZoom !== "24h") params.set("zoom", state.timelineZoom);
  if (state.weekStartsOn !== 0) params.set("weekStart", String(state.weekStartsOn));
  if (state.locale !== "en-US") params.set("locale", state.locale);
  if (state.selection) params.set("sel", `${state.selection.startMinute}-${state.selection.endMinute}`);
  if (state.availabilityPoll.slots.length > 0 || Object.keys(state.availabilityPoll.votes).length > 0) {
    params.set("poll", encodeJson(state.availabilityPoll));
  }
  return params.toString();
}

export function parseSharedStateFromParams(
  params: Record<string, string | string[] | undefined>
): Partial<AppState> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      search.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, entry));
    }
  }
  return parseSharedState(`?${search.toString()}`);
}

export function parseShareModeFromParams(params: Record<string, string | string[] | undefined>): ShareMode {
  const view = params.view;
  const value = Array.isArray(view) ? view[0] : view;
  return value === "readonly" ? "readOnly" : "edit";
}

export function parseShareMode(search: string): ShareMode {
  return new URLSearchParams(search).get("view") === "readonly" ? "readOnly" : "edit";
}

export function parseSharedState(search: string): Partial<AppState> {
  const params = new URLSearchParams(search);
  const next: Partial<AppState> = {};

  const zones = params.get("zones");
  if (zones) {
    try {
      const parsed = decodeJson<EncodedZone[]>(zones);
      next.zones = parsed.map((zone, index): ZoneEntry => ({
        id: `${zone.z}-${index}`,
        label: zone.l,
        city: zone.c,
        country: zone.co,
        countryCode: zone.cc,
        region: zone.rg,
        timeZone: zone.z,
        fixed: Boolean(zone.f),
        workingHours: zone.wh ? { start: zone.wh[0], end: zone.wh[1] } : undefined,
        breakWindow: zone.br ? { start: zone.br[0], end: zone.br[1] } : undefined,
        flexible: Boolean(zone.fx),
        pinned: Boolean(zone.p),
        frozen: Boolean(zone.fr),
        favorite: Boolean(zone.fav)
      }));
    } catch {
      // Ignore malformed shared state and keep local defaults.
    }
  }

  const date = params.get("date");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = date;

  const work = params.get("work")?.split("-").map(Number);
  if (work?.length === 2 && work.every((value) => Number.isFinite(value))) {
    next.workingHours = { start: work[0], end: work[1] } satisfies WorkingHours;
  }

  if (params.has("avoidWeekends")) {
    next.schedulingRules = {
      avoidWeekends: params.get("avoidWeekends") === "1"
    };
  }

  const sel = params.get("sel")?.split("-").map(Number);
  if (sel?.length === 2 && sel.every((value) => Number.isFinite(value))) {
    next.selection = { startMinute: sel[0], endMinute: sel[1] } satisfies SelectionRange;
  }

  const duration = Number(params.get("dur"));
  if (Number.isFinite(duration) && duration > 0) next.durationMinutes = duration;
  next.compact = params.get("compact") === "1";
  const timeFormat = params.get("fmt");
  if (timeFormat === "12h" || timeFormat === "24h") next.timeFormat = timeFormat;
  const rowSort = params.get("sort");
  if (rowSort === "custom" || rowSort === "name" || rowSort === "offset" || rowSort === "localTime") next.rowSort = rowSort;
  const timelineZoom = params.get("zoom");
  if (timelineZoom === "12h" || timelineZoom === "24h" || timelineZoom === "3d" || timelineZoom === "week") {
    next.timelineZoom = timelineZoom;
  }
  const weekStartsOn = Number(params.get("weekStart"));
  if (weekStartsOn === 0 || weekStartsOn === 1 || weekStartsOn === 6) next.weekStartsOn = weekStartsOn;
  const locale = params.get("locale");
  if (locale && /^[a-z]{2,3}(-[A-Z]{2})?$/.test(locale)) next.locale = locale;

  const poll = params.get("poll");
  if (poll) {
    try {
      const parsed = decodeJson<AvailabilityPollState>(poll);
      next.availabilityPoll = {
        participant: parsed.participant ?? "",
        slots: Array.isArray(parsed.slots) ? parsed.slots : [],
        votes: parsed.votes ?? {}
      };
    } catch {
      // Ignore malformed poll state.
    }
  }

  return next;
}

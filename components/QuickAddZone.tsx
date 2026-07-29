"use client";

import { Clock, Plus, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import {
  COMMON_TIME_ZONES,
  citySearchText,
  countryCodeForCountry,
  isValidTimeZone,
  regionForTimeZone,
  zoneFromCity,
  zoneFromRawTimeZone
} from "@/lib/timezones";
import type { ZoneEntry } from "@/types";

type QuickAddZoneProps = {
  zones: ZoneEntry[];
  recentZones: ZoneEntry[];
  disabled?: boolean;
  onAdd: (zone: ZoneEntry) => void;
};

export function QuickAddZone({ zones, recentZones, disabled = false, onAdd }: QuickAddZoneProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const existing = useMemo(() => new Set(zones.map((zone) => zone.timeZone)), [zones]);
  const favorites = useMemo(() => zones.filter((zone) => zone.favorite), [zones]);

  const results = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const entries = clean
      ? COMMON_TIME_ZONES.filter((entry) => citySearchText(entry).includes(clean))
      : COMMON_TIME_ZONES;
    return entries.slice(0, 6);
  }, [query]);

  function add(zone: ZoneEntry) {
    if (disabled) return;
    if (existing.has(zone.timeZone)) return;
    onAdd(zone);
    setQuery("");
    setOpen(false);
  }

  function addRaw() {
    const raw = query.trim();
    if (disabled) return;
    if (!raw || !isValidTimeZone(raw) || existing.has(raw)) return;
    add(zoneFromRawTimeZone(raw));
  }

  return (
    <div className="relative min-w-[16rem] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="zone-search"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          if (disabled) return;
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") addRaw();
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Place or timezone"
        disabled={disabled}
        className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
        aria-label="Add place or timezone"
      />
      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="max-h-72 overflow-auto p-2">
            {!query.trim() && favorites.length > 0 ? (
              <div className="mb-2 border-b border-border pb-2">
                <p className="mb-1 flex items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Star className="h-3 w-3" />
                  Favorites
                </p>
                {favorites.slice(0, 4).map((zone) => (
                  <button
                    key={`favorite-${zone.id}`}
                    type="button"
                    disabled={existing.has(zone.timeZone)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => add({ ...zone, id: `${zone.timeZone}-${Date.now()}` })}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                  >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{zone.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[zone.countryCode, zone.region, zone.timeZone].filter(Boolean).join(" · ")}
                      </span>
                      </span>
                    <Plus className="h-4 w-4 shrink-0" />
                  </button>
                ))}
              </div>
            ) : null}
            {!query.trim() && recentZones.length > 0 ? (
              <div className="mb-2 border-b border-border pb-2">
                <p className="mb-1 flex items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recent
                </p>
                {recentZones.slice(0, 4).map((zone) => (
                  <button
                    key={`recent-${zone.timeZone}`}
                    type="button"
                    disabled={existing.has(zone.timeZone)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => add({ ...zone, id: `${zone.timeZone}-${Date.now()}` })}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                  >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{zone.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[zone.countryCode, zone.region, zone.timeZone].filter(Boolean).join(" · ")}
                      </span>
                      </span>
                    <Plus className="h-4 w-4 shrink-0" />
                  </button>
                ))}
              </div>
            ) : null}
            {results.map((entry) => {
              const disabled = existing.has(entry.timeZone);
              return (
                <button
                  key={`${entry.city}-${entry.timeZone}`}
                  type="button"
                  disabled={disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    add(zoneFromCity(entry))
                  }
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{entry.city}</span>
                      <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {entry.countryCode ?? countryCodeForCountry(entry.country) ?? entry.country.slice(0, 2).toUpperCase()}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {entry.country} · {entry.region ?? regionForTimeZone(entry.timeZone)} · {entry.timeZone}
                    </span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0" />
                </button>
              );
            })}
            {query.trim() && isValidTimeZone(query.trim()) && !existing.has(query.trim()) ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={addRaw}
                className="mt-1 flex w-full items-center justify-between rounded-md bg-primary/10 px-3 py-2 text-left text-sm font-semibold text-primary"
              >
                Add {query.trim()}
                <Plus className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

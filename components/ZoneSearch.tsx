"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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

type ZoneSearchProps = {
  zones: ZoneEntry[];
  onAdd: (zone: ZoneEntry) => void;
};

export function ZoneSearch({ zones, onAdd }: ZoneSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const existing = useMemo(() => new Set(zones.map((zone) => zone.timeZone)), [zones]);

  const results = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return COMMON_TIME_ZONES.slice(0, 8);
    return COMMON_TIME_ZONES.filter((entry) => {
      return citySearchText(entry).includes(clean);
    }).slice(0, 10);
  }, [query]);

  function addRaw() {
    const raw = query.trim();
    if (!raw || !isValidTimeZone(raw) || existing.has(raw)) return;
    onAdd(zoneFromRawTimeZone(raw));
    setQuery("");
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft" aria-labelledby="zone-search-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 id="zone-search-title" className="text-sm font-semibold">
            Add places
          </h2>
          <p className="text-xs text-muted-foreground">Search cities or paste an IANA timezone.</p>
        </div>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          id="zone-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addRaw();
          }}
          placeholder="Berlin, Singapore, America/Los_Angeles"
          className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
          aria-label="Search cities and time zones"
        />
      </div>
      <div className="mt-3 grid max-h-80 gap-2 overflow-auto pr-1">
        {results.map((entry) => {
          const disabled = existing.has(entry.timeZone);
          return (
            <button
              key={`${entry.city}-${entry.timeZone}`}
              type="button"
              disabled={disabled}
              onClick={() => {
                onAdd(zoneFromCity(entry));
                setQuery("");
              }}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{entry.city}</span>
                  <span className="shrink-0 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
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
            onClick={addRaw}
            className="flex items-center justify-between rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Add {query.trim()}
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

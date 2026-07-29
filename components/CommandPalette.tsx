"use client";

import { Command, CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseCommand, type ParsedCommand } from "@/lib/command-parser";
import { COMMON_TIME_ZONES, citySearchText, countryCodeForCountry, regionForTimeZone, zoneFromCity } from "@/lib/timezones";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommand: (command: ParsedCommand) => void;
};

const EXAMPLES = ["add Berlin", "next Tuesday", "duration 45m", "sort offset", "avoid weekends", "12h"];

export function CommandPalette({ open, onOpenChange, onCommand }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseCommand(query), [query]);
  const citySuggestions = useMemo(() => {
    const clean = query.trim().replace(/^add\s+/i, "").toLowerCase();
    if (!clean) return COMMON_TIME_ZONES.slice(0, 5);
    return COMMON_TIME_ZONES.filter((entry) => citySearchText(entry).includes(clean)).slice(0, 5);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  function run(command: ParsedCommand | null = parsed) {
    if (!command) return;
    onCommand(command);
    setQuery("");
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") run();
            }}
            placeholder="Try: add Berlin, next Tuesday, duration 45m"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
            aria-label="Command"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[28rem] overflow-auto p-3">
          {parsed ? (
            <button
              type="button"
              onClick={() => run(parsed)}
              className="mb-2 flex w-full items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-left text-sm"
            >
              <span>
                <span className="block font-semibold">Run command</span>
                <span className="text-xs text-muted-foreground">{query}</span>
              </span>
              <CornerDownLeft className="h-4 w-4 text-primary" />
            </button>
          ) : null}

          <div className="mb-3">
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Examples</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuery(example)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Places</p>
            {citySuggestions.map((entry) => (
              <button
                key={`${entry.city}-${entry.timeZone}`}
                type="button"
                onClick={() =>
                  run({
                    type: "addZone",
                    zone: zoneFromCity(entry)
                  })
                }
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{entry.city}</span>
                    <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {entry.countryCode ?? countryCodeForCountry(entry.country) ?? entry.country.slice(0, 2).toUpperCase()}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.country} · {entry.region ?? regionForTimeZone(entry.timeZone)} · {entry.timeZone}
                  </span>
                </span>
                <Command className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Command, Eye, Keyboard, Link as LinkIcon, LockKeyhole, PanelRightOpen, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BestTimesPanel } from "@/components/BestTimesPanel";
import { AvailabilityPoll } from "@/components/AvailabilityPoll";
import { CommandPalette } from "@/components/CommandPalette";
import { DateControls } from "@/components/DateControls";
import { DateStrip } from "@/components/DateStrip";
import { QuickAddZone } from "@/components/QuickAddZone";
import { SelectionSummary } from "@/components/SelectionSummary";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ShareQrPanel } from "@/components/ShareQrPanel";
import { TeamPresets } from "@/components/TeamPresets";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimeGrid } from "@/components/TimeGrid";
import { decryptShareQuery, encryptShareQuery } from "@/lib/protected-share";
import { encodeState, parseSharedState, parseShareMode, type ShareMode } from "@/lib/share-state";
import { getLocalTimeZone, labelForTimeZone, metadataForTimeZone } from "@/lib/timezones";
import { addDays, todayIsoDate } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import type { ParsedCommand } from "@/lib/command-parser";
import type { AppState, SelectionRange, ZoneEntry } from "@/types";

const DURATIONS = [15, 30, 45, 60, 90, 120];
const STORAGE_KEY = "timegrid-state-v1";
const RECENT_ZONES_KEY = "timegrid-recent-zones-v1";
const LEGACY_POLL_KEY = "timegrid-availability-poll-v1";

function defaultZones(): ZoneEntry[] {
  const local = getLocalTimeZone();
  const seeds = [
    { label: `Local - ${labelForTimeZone(local)}`, city: labelForTimeZone(local), timeZone: local },
    { label: "New York", city: "New York", timeZone: "America/New_York" },
    { label: "London", city: "London", timeZone: "Europe/London" },
    { label: "Tokyo", city: "Tokyo", timeZone: "Asia/Tokyo" }
  ];
  const seen = new Set<string>();
  return seeds
    .filter((seed) => {
      if (seen.has(seed.timeZone)) return false;
      seen.add(seed.timeZone);
      return true;
    })
    .map((seed, index) => ({ ...seed, ...metadataForTimeZone(seed.timeZone), id: `${seed.timeZone}-${index}` }));
}

function defaultState(): AppState {
  return {
    zones: defaultZones(),
    date: todayIsoDate(),
    workingHours: { start: 9, end: 17 },
    schedulingRules: { avoidWeekends: false },
    availabilityPoll: { participant: "", slots: [], votes: {} },
    selection: { startMinute: 13 * 60, endMinute: 14 * 60 },
    durationMinutes: 60,
    compact: false,
    timeFormat: "24h",
    rowSort: "custom",
    timelineZoom: "24h",
    weekStartsOn: 0,
    locale: "en-US"
  };
}

type HomePageProps = {
  initialUrlState: Partial<AppState>;
  initialShareMode: ShareMode;
  initialProtectedPayload?: string;
};

export function HomePage({ initialUrlState, initialShareMode, initialProtectedPayload }: HomePageProps) {
  const [state, setState] = useState<AppState>(() => ({ ...defaultState(), ...initialUrlState }));
  const [shareMode, setShareMode] = useState<ShareMode>(initialShareMode);
  const [protectedPayload, setProtectedPayload] = useState(initialProtectedPayload);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [protectPassword, setProtectPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState<ShareMode | "protected" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [recentZones, setRecentZones] = useState<ZoneEntry[]>([]);

  useEffect(() => {
    if (initialProtectedPayload) {
      setReady(true);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    let restored: Partial<AppState> = {};
    try {
      restored = stored ? (JSON.parse(stored) as Partial<AppState>) : {};
    } catch {
      restored = {};
    }
    try {
      setRecentZones(JSON.parse(localStorage.getItem(RECENT_ZONES_KEY) ?? "[]") as ZoneEntry[]);
    } catch {
      setRecentZones([]);
    }
    let legacyPoll = {};
    try {
      legacyPoll = JSON.parse(localStorage.getItem(LEGACY_POLL_KEY) ?? "{}");
    } catch {
      legacyPoll = {};
    }
    const nextState = { ...defaultState(), availabilityPoll: { ...defaultState().availabilityPoll, ...legacyPoll }, ...restored, ...initialUrlState };
    setState(nextState);
    setReady(true);
  }, [initialProtectedPayload, initialUrlState]);

  useEffect(() => {
    if (!ready) return;
    if (protectedPayload) return;
    if (shareMode === "edit") localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const query = encodeState(state, shareMode);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, [protectedPayload, ready, shareMode, state]);

  const editableShareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}?${encodeState(state)}`;
  }, [state]);
  const readOnlyShareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}?${encodeState(state, "readOnly")}`;
  }, [state]);
  const shareUrl = shareMode === "readOnly" ? readOnlyShareUrl : editableShareUrl;
  const readOnly = shareMode === "readOnly";
  const locked = Boolean(protectedPayload);

  const updateState = useCallback((patch: Partial<AppState>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const setSelection = useCallback((selection: SelectionRange) => {
    if (readOnly) return;
    setState((current) => ({ ...current, selection }));
  }, [readOnly]);

  const copyShareLink = async (mode: ShareMode) => {
    await navigator.clipboard.writeText(mode === "readOnly" ? readOnlyShareUrl : editableShareUrl);
    setCopied(mode);
    window.setTimeout(() => setCopied(null), 1400);
  };

  const copyProtectedLink = async () => {
    const password = protectPassword.trim();
    if (!password || typeof window === "undefined") return;
    const payload = await encryptShareQuery(encodeState(state, shareMode), password);
    await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?protected=${encodeURIComponent(payload)}`);
    setCopied("protected");
    window.setTimeout(() => setCopied(null), 1400);
  };

  const unlockProtectedLink = async () => {
    if (!protectedPayload) return;
    setUnlockError("");
    try {
      const query = await decryptShareQuery(protectedPayload, unlockPassword);
      setState({ ...defaultState(), ...parseSharedState(`?${query}`) });
      setShareMode(parseShareMode(`?${query}`));
      setProtectedPayload(undefined);
      setUnlockPassword("");
      window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    } catch {
      setUnlockError("That passphrase did not unlock this link.");
    }
  };

  function rememberRecentZone(zone: ZoneEntry) {
    const next = [zone, ...recentZones.filter((entry) => entry.timeZone !== zone.timeZone)].slice(0, 8);
    setRecentZones(next);
    localStorage.setItem(RECENT_ZONES_KEY, JSON.stringify(next));
  }

  function addZone(zone: ZoneEntry) {
    if (readOnly) return;
    if (state.zones.some((existing) => existing.timeZone === zone.timeZone)) return;
    rememberRecentZone(zone);
    updateState({ zones: [...state.zones, zone] });
  }

  function runCommand(command: ParsedCommand) {
    if (readOnly) return;
    if (command.type === "addZone") addZone(command.zone);
    if (command.type === "date") updateState({ date: command.date });
    if (command.type === "duration") {
      const start = state.selection?.startMinute ?? 9 * 60;
      updateState({
        durationMinutes: command.durationMinutes,
        selection: { startMinute: start, endMinute: Math.min(1440, start + command.durationMinutes) }
      });
    }
    if (command.type === "timeFormat") updateState({ timeFormat: command.timeFormat });
    if (command.type === "toggleSettings") setSettingsOpen((open) => !open);
    if (command.type === "avoidWeekends") updateState({ schedulingRules: { ...state.schedulingRules, avoidWeekends: command.avoidWeekends } });
    if (command.type === "rowSort") updateState({ rowSort: command.rowSort });
    if (command.type === "focusSearch") document.getElementById("zone-search")?.focus();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (readOnly) {
        if (event.key.toLowerCase() === "c" && state.selection) {
          import("@/lib/time-utils").then(({ formatSelectionSummary }) => {
            navigator.clipboard.writeText(
              formatSelectionSummary(state.date, state.selection!, state.zones, state.zones[0]?.timeZone ?? "UTC", state.locale)
            );
          });
        }
        return;
      }
      if (event.key === "/" && !editing) {
        event.preventDefault();
        document.getElementById("zone-search")?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (editing) return;
      if (event.key === "ArrowLeft") updateState({ date: addDays(state.date, -1) });
      if (event.key === "ArrowRight") updateState({ date: addDays(state.date, 1) });
      if (event.key.toLowerCase() === "t") updateState({ date: todayIsoDate() });
      if (event.key.toLowerCase() === "c" && state.selection) {
        import("@/lib/time-utils").then(({ formatSelectionSummary }) => {
          navigator.clipboard.writeText(
            formatSelectionSummary(state.date, state.selection!, state.zones, state.zones[0]?.timeZone ?? "UTC", state.locale)
          );
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [readOnly, state.date, state.locale, state.selection, state.schedulingRules, state.zones, updateState]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      {locked ? (
        <section className="mx-auto mt-20 grid w-full max-w-lg gap-4 rounded-lg border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Protected TimeGrid link</h1>
              <p className="text-sm text-muted-foreground">Enter the passphrase shared with this link to unlock the view.</p>
            </div>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-muted-foreground">Passphrase</span>
            <input
              type="password"
              value={unlockPassword}
              onChange={(event) => setUnlockPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") unlockProtectedLink();
              }}
              className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </label>
          {unlockError ? <p className="text-sm font-medium text-destructive">{unlockError}</p> : null}
          <button
            type="button"
            onClick={unlockProtectedLink}
            disabled={!unlockPassword.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <LockKeyhole className="h-4 w-4" />
            Unlock
          </button>
        </section>
      ) : null}
      {!locked ? (
        <>
      <header className="flex flex-col gap-4 rounded-lg border border-border bg-card/92 p-4 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">TimeGrid</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Plan across time zones without the clutter.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Compare cities, find humane overlap, and share meeting windows that survive daylight saving shifts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateControls date={state.date} locale={state.locale} disabled={readOnly} onChange={(date) => updateState({ date })} />
          <ThemeToggle />
        </div>
      </header>
      {readOnly ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm shadow-soft">
          <div className="flex items-center gap-2 font-medium text-primary">
            <Eye className="h-4 w-4" />
            Read-only shared view
          </div>
          <button
            type="button"
            onClick={() => setShareMode("edit")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Edit a copy
          </button>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 content-start gap-5">
          <div className="grid gap-3 rounded-lg border border-border bg-card p-3 shadow-soft">
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
              <QuickAddZone
                zones={state.zones}
                recentZones={recentZones}
                disabled={readOnly}
                onAdd={addZone}
              />
              <DateStrip date={state.date} weekStartsOn={state.weekStartsOn} locale={state.locale} disabled={readOnly} onChange={(date) => updateState({ date })} />
              <div className="flex flex-wrap items-center gap-2 2xl:ml-auto">
                {!readOnly ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen((open) => !open)}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-expanded={settingsOpen}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <Command className="h-4 w-4" />
                      Command
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => copyShareLink("edit")}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <LinkIcon className="h-4 w-4" />
                  {copied === "edit" ? "Copied" : "Editable link"}
                </button>
                <button
                  type="button"
                  onClick={() => copyShareLink("readOnly")}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Eye className="h-4 w-4" />
                  {copied === "readOnly" ? "Copied" : "Read-only link"}
                </button>
                <label className="flex h-10 min-w-40 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm">
                  <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={protectPassword}
                    onChange={(event) => setProtectPassword(event.target.value)}
                    placeholder="Passphrase"
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    aria-label="Protected link passphrase"
                  />
                </label>
                <button
                  type="button"
                  onClick={copyProtectedLink}
                  disabled={!protectPassword.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <LockKeyhole className="h-4 w-4" />
                  {copied === "protected" ? "Copied" : "Protected link"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2" aria-label="Meeting duration">
              {DURATIONS.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => {
                    if (readOnly) return;
                    const start = state.selection?.startMinute ?? 9 * 60;
                    updateState({
                      durationMinutes: duration,
                      selection: { startMinute: start, endMinute: Math.min(1440, start + duration) }
                    });
                  }}
                  disabled={readOnly}
                  className={cn(
                    "h-9 rounded-md border border-border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary",
                    state.durationMinutes === duration ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  )}
                >
                  {duration < 60 ? `${duration}m` : duration === 60 ? "1h" : `${duration / 60}h`}
                </button>
              ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="h-4 w-4" />
                <span>{readOnly ? "Shortcut: C copies selected time" : "Shortcuts: arrows, T, /, C"}</span>
              </div>
            </div>
          </div>

          <TimeGrid
            date={state.date}
            zones={state.zones}
            workingHours={state.workingHours}
            schedulingRules={state.schedulingRules}
            selection={state.selection}
            compact={state.compact}
            timeFormat={state.timeFormat}
            rowSort={state.rowSort}
            timelineZoom={state.timelineZoom}
            locale={state.locale}
            readOnly={readOnly}
            onSelectionChange={setSelection}
            onZonesChange={(zones) => updateState({ zones })}
          />

          {settingsOpen && !readOnly ? (
            <SettingsPanel
              workingHours={state.workingHours}
              schedulingRules={state.schedulingRules}
              compact={state.compact}
              zones={state.zones}
              onWorkingHoursChange={(workingHours) => updateState({ workingHours })}
              onSchedulingRulesChange={(schedulingRules) => updateState({ schedulingRules })}
              onCompactChange={(compact) => updateState({ compact })}
              timeFormat={state.timeFormat}
              onTimeFormatChange={(timeFormat) => updateState({ timeFormat })}
              rowSort={state.rowSort}
              onRowSortChange={(rowSort) => updateState({ rowSort })}
              timelineZoom={state.timelineZoom}
              onTimelineZoomChange={(timelineZoom) => updateState({ timelineZoom })}
              weekStartsOn={state.weekStartsOn}
              onWeekStartsOnChange={(weekStartsOn) => updateState({ weekStartsOn })}
              locale={state.locale}
              onLocaleChange={(locale) => updateState({ locale })}
            />
          ) : null}
        </div>

        <aside className="grid content-start gap-5">
          <BestTimesPanel
            date={state.date}
            zones={state.zones}
            workingHours={state.workingHours}
            schedulingRules={state.schedulingRules}
            durationMinutes={state.durationMinutes}
            locale={state.locale}
            readOnly={readOnly}
            onSelect={(selection, date) => updateState({ selection, date })}
          />
          <SelectionSummary
            date={state.date}
            selection={state.selection}
            zones={state.zones}
            workingHours={state.workingHours}
            schedulingRules={state.schedulingRules}
            shareUrl={shareUrl}
            locale={state.locale}
            onSelect={readOnly ? undefined : (selection, date) => updateState({ selection, date })}
          />
          <ShareQrPanel currentUrl={shareUrl} editableUrl={editableShareUrl} readOnlyUrl={readOnlyShareUrl} />
          <AvailabilityPoll
            date={state.date}
            selection={state.selection}
            zones={state.zones}
            poll={state.availabilityPoll}
            shareUrl={shareUrl}
            locale={state.locale}
            readOnly={readOnly}
            onPollChange={(availabilityPoll) => updateState({ availabilityPoll })}
          />
          {!readOnly ? <TeamPresets state={state} onLoad={(patch) => updateState(patch)} /> : null}
          <section className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
            <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <PanelRightOpen className="h-4 w-4 text-primary" />
              Keyboard
            </div>
            <p>Use left and right arrows to change days, T for today, slash to add a city, and C to copy the selected time.</p>
          </section>
        </aside>
      </section>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onCommand={runCommand} />
        </>
      ) : null}
    </main>
  );
}

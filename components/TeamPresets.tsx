"use client";

import { Save, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppState, TeamPreset } from "@/types";

const PRESETS_KEY = "timegrid-team-presets-v1";

type TeamPresetsProps = {
  state: AppState;
  onLoad: (state: Partial<AppState>) => void;
};

export function TeamPresets({ state, onLoad }: TeamPresetsProps) {
  const [name, setName] = useState("");
  const [presets, setPresets] = useState<TeamPreset[]>([]);

  useEffect(() => {
    try {
      setPresets(JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "[]") as TeamPreset[]);
    } catch {
      setPresets([]);
    }
  }, []);

  function persist(next: TeamPreset[]) {
    setPresets(next);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  }

  function savePreset() {
    const cleanName = name.trim() || `Team ${presets.length + 1}`;
    const preset: TeamPreset = {
      id: crypto.randomUUID(),
      name: cleanName,
      zones: state.zones,
      workingHours: state.workingHours,
      schedulingRules: state.schedulingRules,
      durationMinutes: state.durationMinutes,
      compact: state.compact,
      timeFormat: state.timeFormat,
      rowSort: state.rowSort,
      timelineZoom: state.timelineZoom,
      weekStartsOn: state.weekStartsOn,
      locale: state.locale,
      createdAt: new Date().toISOString()
    };
    persist([preset, ...presets.filter((item) => item.name.toLowerCase() !== cleanName.toLowerCase())].slice(0, 12));
    setName("");
  }

  function deletePreset(id: string) {
    persist(presets.filter((preset) => preset.id !== id));
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft" aria-labelledby="team-presets-title">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 id="team-presets-title" className="text-sm font-semibold">
          Team presets
        </h2>
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") savePreset();
          }}
          placeholder="Preset name"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          aria-label="Preset name"
        />
        <button
          type="button"
          onClick={savePreset}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {presets.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background p-3 text-sm text-muted-foreground">
            Save your recurring teams here for one-click setup.
          </p>
        ) : null}
        {presets.map((preset) => (
          <div key={preset.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-2">
            <button
              type="button"
              onClick={() =>
                onLoad({
                  zones: preset.zones,
                  workingHours: preset.workingHours,
                  schedulingRules: preset.schedulingRules ?? { avoidWeekends: false },
                  durationMinutes: preset.durationMinutes,
                  compact: preset.compact,
                  timeFormat: preset.timeFormat,
                  rowSort: preset.rowSort ?? "custom",
                  timelineZoom: preset.timelineZoom ?? "24h",
                  weekStartsOn: preset.weekStartsOn ?? 0,
                  locale: preset.locale ?? "en-US"
                })
              }
              className="min-w-0 flex-1 rounded px-2 py-1 text-left hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span className="block truncate text-sm font-semibold">{preset.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {preset.zones.length} zones · {preset.durationMinutes} min · {preset.timeFormat}
              </span>
            </button>
            <button
              type="button"
              onClick={() => deletePreset(preset.id)}
              className="rounded p-2 text-destructive hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`Delete ${preset.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

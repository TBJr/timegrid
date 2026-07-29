"use client";

import { Clipboard, Link as LinkIcon, Plus, Trash2, Vote } from "lucide-react";
import { baseMinuteToUtc, dateLabel, formatTime } from "@/lib/time-utils";
import type { AvailabilityPollState, PollVote, PollSlot, SelectionRange, ZoneEntry } from "@/types";

type AvailabilityPollProps = {
  date: string;
  selection: SelectionRange | null;
  zones: ZoneEntry[];
  poll: AvailabilityPollState;
  shareUrl: string;
  locale: string;
  readOnly?: boolean;
  onPollChange: (poll: AvailabilityPollState) => void;
};

function slotLabel(slot: PollSlot, zones: ZoneEntry[], locale: string) {
  const anchor = zones[0]?.timeZone ?? "UTC";
  const start = baseMinuteToUtc(slot.date, slot.selection.startMinute, anchor);
  const end = baseMinuteToUtc(slot.date, slot.selection.endMinute, anchor);
  return `${dateLabel(slot.date, locale)} · ${formatTime(start, anchor, locale)}-${formatTime(end, anchor, locale)} ${zones[0]?.label ?? "UTC"}`;
}

export function AvailabilityPoll({ date, selection, zones, poll, shareUrl, locale, readOnly = false, onPollChange }: AvailabilityPollProps) {
  function persist(next: AvailabilityPollState) {
    if (readOnly) return;
    onPollChange(next);
  }

  function addSelectedSlot() {
    if (!selection) return;
    const exists = poll.slots.some(
      (slot) =>
        slot.date === date &&
        slot.selection.startMinute === selection.startMinute &&
        slot.selection.endMinute === selection.endMinute
    );
    if (exists) return;
    persist({
      ...poll,
      slots: [
        ...poll.slots,
        {
          id: crypto.randomUUID(),
          date,
          selection
        }
      ]
    });
  }

  function removeSlot(id: string) {
    const votes = { ...poll.votes };
    delete votes[id];
    persist({ ...poll, slots: poll.slots.filter((slot) => slot.id !== id), votes });
  }

  function vote(slotId: string, value: PollVote) {
    const participant = poll.participant.trim() || "Anonymous";
    persist({
      ...poll,
      votes: {
        ...poll.votes,
        [slotId]: {
          ...(poll.votes[slotId] ?? {}),
          [participant]: value
        }
      }
    });
  }

  function copySummary() {
    const lines = ["TimeGrid availability poll", ""];
    poll.slots.forEach((slot) => {
      const votes = poll.votes[slot.id] ?? {};
      const counts = { yes: 0, maybe: 0, no: 0 };
      Object.values(votes).forEach((entry) => {
        counts[entry] += 1;
      });
      lines.push(slotLabel(slot, zones, locale));
      lines.push(`Yes: ${counts.yes} · Maybe: ${counts.maybe} · No: ${counts.no}`);
      Object.entries(votes).forEach(([name, value]) => lines.push(`- ${name}: ${value}`));
      lines.push("");
    });
    navigator.clipboard.writeText(lines.join("\n").trim());
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft" aria-labelledby="availability-poll-title">
      <div className="mb-3 flex items-center gap-2">
        <Vote className="h-4 w-4 text-primary" />
        <h2 id="availability-poll-title" className="text-sm font-semibold">
          Availability poll
        </h2>
      </div>
      <div className="grid gap-2">
        <input
          value={poll.participant}
          onChange={(event) => persist({ ...poll, participant: event.target.value })}
          disabled={readOnly}
          placeholder="Your name"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          aria-label="Poll participant name"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={addSelectedSlot}
            disabled={readOnly || !selection}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus className="h-4 w-4" />
            Add selected
          </button>
          <button
            type="button"
            onClick={copySummary}
            disabled={poll.slots.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Clipboard className="h-4 w-4" />
            Copy poll
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            disabled={poll.slots.length === 0}
            className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            <LinkIcon className="h-4 w-4" />
            Copy poll link
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {poll.slots.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background p-3 text-sm text-muted-foreground">
            Add selected meeting times as poll options, then collect yes/maybe/no responses.
          </p>
        ) : null}
        {poll.slots.map((slot) => {
          const participant = poll.participant.trim() || "Anonymous";
          const currentVote = poll.votes[slot.id]?.[participant];
          return (
            <div key={slot.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{slotLabel(slot, zones, locale)}</p>
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  disabled={readOnly}
                  className="rounded p-1 text-destructive hover:bg-muted"
                  aria-label="Remove poll slot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {(["yes", "maybe", "no"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => vote(slot.id, value)}
                    disabled={readOnly}
                    className={`h-8 rounded-md border border-border text-xs font-bold capitalize ${
                      currentVote === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

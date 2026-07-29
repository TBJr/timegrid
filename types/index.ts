export type ZoneEntry = {
  id: string;
  label: string;
  city: string;
  country?: string;
  countryCode?: string;
  region?: string;
  timeZone: string;
  fixed?: boolean;
  workingHours?: WorkingHours;
  breakWindow?: WorkingHours;
  flexible?: boolean;
  pinned?: boolean;
  frozen?: boolean;
  favorite?: boolean;
};

export type WorkingHours = {
  start: number;
  end: number;
};

export type SelectionRange = {
  startMinute: number;
  endMinute: number;
};

export type RecurrenceFrequency = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  count: number;
};

export type AppState = {
  zones: ZoneEntry[];
  date: string;
  workingHours: WorkingHours;
  schedulingRules: SchedulingRules;
  availabilityPoll: AvailabilityPollState;
  selection: SelectionRange | null;
  durationMinutes: number;
  compact: boolean;
  timeFormat: "12h" | "24h";
  rowSort: "custom" | "name" | "offset" | "localTime";
  timelineZoom: "12h" | "24h" | "3d" | "week";
  weekStartsOn: 0 | 1 | 6;
  locale: string;
};

export type SchedulingRules = {
  avoidWeekends: boolean;
};

export type PollVote = "yes" | "maybe" | "no";

export type PollSlot = {
  id: string;
  date: string;
  selection: SelectionRange;
};

export type AvailabilityPollState = {
  participant: string;
  slots: PollSlot[];
  votes: Record<string, Record<string, PollVote>>;
};

export type TeamPreset = {
  id: string;
  name: string;
  zones: ZoneEntry[];
  workingHours: WorkingHours;
  schedulingRules: SchedulingRules;
  durationMinutes: number;
  compact: boolean;
  timeFormat: "12h" | "24h";
  rowSort: "custom" | "name" | "offset" | "localTime";
  timelineZoom: "12h" | "24h" | "3d" | "week";
  weekStartsOn: 0 | 1 | 6;
  locale: string;
  createdAt: string;
};

export type OverlapQuality = "great" | "okay" | "bad";

export type MeetingSlot = {
  date: string;
  startMinute: number;
  endMinute: number;
  score: number;
  averagePain: number;
  worstParticipant?: string;
  quality: OverlapQuality;
};

export type FairnessRotationSlot = MeetingSlot & {
  occurrence: number;
  cumulativePain: Record<string, number>;
};

export type ParticipantPain = {
  zoneId: string;
  label: string;
  localMinute: number;
  kind: "work" | "off" | "night" | "break" | "weekend";
  pain: number;
  flexible: boolean;
};

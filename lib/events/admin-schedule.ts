import type { RecurrenceFrequency, EventRecurrence, GeneratedOccurrence, EventInput } from "@/lib/events/validation";
import { generateEventOccurrences } from "@/lib/events/validation";

export type AdminScheduleRow = {
  id?: string;
  slug?: string | null;
  name?: string;
  description?: string;
  venue?: string;
  starts_at: string;
  ends_at?: string | null;
  recurrence_frequency?: RecurrenceFrequency | null;
  recurrence_weekdays?: number[] | null;
  recurrence_end_date?: string | null;
  recurrence_count?: number | null;
  moderation_status?: "pending" | "approved" | "rejected" | null;
  submitted_at?: string;
  updated_at?: string;
};

export type EventSchedule = {
  isPast: boolean;
  isArchived: boolean;
  displayStartsAt: string;
  sortTime: number;
  repeats: boolean;
};

function recurrenceFromRow(row: AdminScheduleRow): EventRecurrence | undefined {
  if (!row.recurrence_frequency) return undefined;
  return {
    frequency: row.recurrence_frequency,
    ...(row.recurrence_weekdays?.length ? { weekdays: row.recurrence_weekdays } : {}),
    ...(row.recurrence_end_date ? { endDate: row.recurrence_end_date } : {}),
    ...(row.recurrence_count ? { count: row.recurrence_count } : {}),
  };
}

function occurrencesFor(row: AdminScheduleRow): GeneratedOccurrence[] {
  const recurrence = recurrenceFromRow(row);
  if (!recurrence) return [];
  const event: EventInput = {
    name: row.name || "event",
    description: row.description || "event",
    startsAt: row.starts_at,
    ...(row.ends_at ? { endsAt: row.ends_at } : {}),
    timezone: "America/Toronto",
    venue: row.venue || "venue",
    imagePosition: "center",
    recurrence,
  };
  try {
    return generateEventOccurrences(event, row.slug || "event", row.id || "00000000-0000-0000-0000-000000000000");
  } catch {
    return [];
  }
}

function effectiveEnd(startsAt: string, endsAt?: string | null) {
  return new Date(endsAt ?? startsAt).getTime();
}

export function eventSchedule(row: AdminScheduleRow, now = new Date()): EventSchedule {
  const occurrences = occurrencesFor(row);
  const series = occurrences.length
    ? occurrences
    : [{ startsAt: row.starts_at, endsAt: row.ends_at ?? undefined, occurrenceIndex: 0, slug: "" }];
  const nowMs = now.getTime();
  const next = series.find((item) => effectiveEnd(item.startsAt, item.endsAt) >= nowMs) ?? null;
  const last = series[series.length - 1];
  const isPast = effectiveEnd(last.startsAt, last.endsAt) < nowMs;
  const isArchived = row.moderation_status !== "pending" && isPast;
  const sortTime = isArchived
    ? effectiveEnd(last.startsAt, last.endsAt)
    : new Date((next ?? last).startsAt).getTime();

  return {
    isPast,
    isArchived,
    displayStartsAt: (next ?? last).startsAt,
    sortTime,
    repeats: Boolean(row.recurrence_frequency),
  };
}

export function isArchivedEvent(row: AdminScheduleRow, now = new Date()) {
  return eventSchedule(row, now).isArchived;
}

export function canDeleteManagedEvent(row: AdminScheduleRow, now = new Date()) {
  return isArchivedEvent(row, now);
}

type GroupItem<T> = { event: T; schedule: EventSchedule };

export function groupManagedEvents<T extends AdminScheduleRow>(events: T[], now = new Date()) {
  const pending: GroupItem<T>[] = [];
  const upcoming: GroupItem<T>[] = [];
  const archived: GroupItem<T>[] = [];

  for (const event of events) {
    const schedule = eventSchedule(event, now);
    if (event.moderation_status === "pending") pending.push({ event, schedule });
    else if (schedule.isArchived) archived.push({ event, schedule });
    else upcoming.push({ event, schedule });
  }

  pending.sort((first, second) => {
    const firstTime = Date.parse(first.event.submitted_at || first.event.updated_at || first.event.starts_at);
    const secondTime = Date.parse(second.event.submitted_at || second.event.updated_at || second.event.starts_at);
    return secondTime - firstTime;
  });
  upcoming.sort((first, second) => first.schedule.sortTime - second.schedule.sortTime);
  archived.sort((first, second) => second.schedule.sortTime - first.schedule.sortTime);

  return { pending, upcoming, archived };
}

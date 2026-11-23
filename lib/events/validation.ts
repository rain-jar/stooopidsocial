import type { EventStatus } from "@/data/events";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_ZONE = "America/Toronto";
const MAX_RECURRENCES = 52;

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";

export type EventRecurrence = {
  frequency: RecurrenceFrequency;
  weekdays?: number[];
  endDate?: string;
  count?: number;
};

export type GeneratedOccurrence = {
  occurrenceIndex: number;
  slug: string;
  startsAt: string;
  endsAt?: string;
};

export type EventInput = {
  name: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  timezone: typeof TIME_ZONE;
  venue: string;
  address?: string;
  rsvpUrl?: string;
  imageAlt?: string;
  imagePosition: string;
  eventStatus?: EventStatus;
  recurrence?: EventRecurrence;
};

function text(value: unknown, maximum: number, label: string, required = true) {
  const cleaned = typeof value === "string" ? value.trim() : "";
  if (required && !cleaned) throw new Error(`${label} is required.`);
  if (cleaned.length > maximum) throw new Error(`${label} is too long.`);
  return cleaned;
}

function httpUrl(value: unknown) {
  const candidate = text(value, 2_048, "RSVP link", false);
  if (!candidate) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("Enter a complete RSVP link.");
  }
  if (!(["http:", "https:"] as string[]).includes(parsed.protocol)) {
    throw new Error("The RSVP link must use HTTP or HTTPS.");
  }
  return parsed.toString();
}

function easternParts(date: Date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
}

function validDateText(value: unknown, label: string) {
  const candidate = text(value, 10, label);
  const match = DATE_PATTERN.exec(candidate);
  if (!match) throw new Error(`${label} is invalid.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return candidate;
}

function dateAtUtc(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date) {
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

function addCalendarDays(dateText: string, days: number) {
  const date = dateAtUtc(dateText);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

function calendarDayDifference(first: string, second: string) {
  return Math.round((dateAtUtc(second).getTime() - dateAtUtc(first).getTime()) / 86_400_000);
}

function parseRecurrence(input: Record<string, unknown>, startDate: string) {
  if (!(input.recurring === true || input.recurring === "on")) return undefined;

  const frequency = text(input.recurrenceFrequency, 16, "Recurrence frequency");
  if (!(frequency === "weekly" || frequency === "biweekly" || frequency === "monthly")) {
    throw new Error("Choose a valid recurrence frequency.");
  }

  let weekdays: number[] | undefined;
  if (frequency !== "monthly") {
    const values = Array.isArray(input.recurrenceWeekdays)
      ? input.recurrenceWeekdays
      : [input.recurrenceWeekdays];
    weekdays = [...new Set(values.map((value) => Number(value)))].sort((a, b) => a - b);
    if (
      weekdays.length === 0 ||
      weekdays.some((value) => !Number.isInteger(value) || value < 0 || value > 6)
    ) {
      throw new Error("Choose at least one valid recurrence weekday.");
    }
  }

  const endType = text(input.recurrenceEndType, 8, "Recurrence end");
  if (endType === "date") {
    const endDate = validDateText(input.recurrenceEndDate, "Recurrence end date");
    if (endDate < startDate) {
      throw new Error("Recurrence end date must be on or after the start date.");
    }
    return { frequency, ...(weekdays ? { weekdays } : {}), endDate } satisfies EventRecurrence;
  }
  if (endType === "count") {
    const count = Number(input.recurrenceCount);
    if (!Number.isInteger(count) || count < 1 || count > MAX_RECURRENCES) {
      throw new Error(`Recurrence count must be between 1 and ${MAX_RECURRENCES}.`);
    }
    return { frequency, ...(weekdays ? { weekdays } : {}), count } satisfies EventRecurrence;
  }
  throw new Error("Choose when the recurrence ends.");
}

export function easternLocalDateTime(dateValue: unknown, timeValue: unknown, label: string) {
  const dateText = text(dateValue, 10, `${label} date`);
  const timeText = text(timeValue, 5, `${label} time`);
  const dateMatch = DATE_PATTERN.exec(dateText);
  const timeMatch = TIME_PATTERN.exec(timeText);
  if (!dateMatch || !timeMatch) throw new Error(`${label} date or time is invalid.`);

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const dateCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    dateCheck.getUTCFullYear() !== year ||
    dateCheck.getUTCMonth() + 1 !== month ||
    dateCheck.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error(`${label} date or time is invalid.`);
  }

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let guess = localAsUtc;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = easternParts(new Date(guess));
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    guess -= actualAsUtc - localAsUtc;
  }

  const result = new Date(guess);
  const roundTrip = easternParts(result);
  if (
    roundTrip.year !== year ||
    roundTrip.month !== month ||
    roundTrip.day !== day ||
    roundTrip.hour !== hour ||
    roundTrip.minute !== minute
  ) {
    throw new Error(`${label} time does not exist in Eastern Time.`);
  }
  return result.toISOString();
}

function parseEventInput(
  input: Record<string, unknown>,
  hasImage: boolean,
  requireFuture: boolean,
): EventInput {
  const startDate = validDateText(input.startDate, "Start date");
  const startsAt = easternLocalDateTime(startDate, input.startTime, "Start");
  const endDate = text(input.endDate, 10, "End date", false);
  const endTime = text(input.endTime, 5, "End time", false);
  if (endDate && !endTime) {
    throw new Error("Provide an end time with the end date.");
  }
  const endsAt = endTime
    ? easternLocalDateTime(endDate || startDate, endTime, "End")
    : undefined;
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
    throw new Error("End time must be after the start time.");
  }

  if (requireFuture) {
    const startTimestamp = new Date(startsAt).getTime();
    const now = Date.now();
    if (startTimestamp < now - 5 * 60_000) throw new Error("Event start time must be in the future.");
    if (startTimestamp > now + 2 * 365 * 24 * 60 * 60_000) {
      throw new Error("Event start time is too far in the future.");
    }
  }

  const imageAlt = text(input.imageAlt, 300, "Image description", hasImage);
  const address = text(input.address, 400, "Address", false);
  const rsvpUrl = httpUrl(input.rsvpUrl);
  const recurrence = parseRecurrence(input, startDate);
  return {
    name: text(input.name, 160, "Event name"),
    description: text(input.description, 5_000, "Description"),
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    timezone: TIME_ZONE,
    venue: text(input.venue, 240, "Venue"),
    ...(address ? { address } : {}),
    ...(rsvpUrl ? { rsvpUrl } : {}),
    ...(imageAlt ? { imageAlt } : {}),
    imagePosition: "center",
    ...(recurrence ? { recurrence } : {}),
  };
}

function easternDateAndTime(value: string) {
  const parts = easternParts(new Date(value));
  return {
    date: `${parts.year.toString().padStart(4, "0")}-${parts.month.toString().padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`,
    time: `${parts.hour.toString().padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`,
  };
}

function occurrenceSlug(baseSlug: string, date: string, eventId: string) {
  const suffix = `-${date}-${eventId.replaceAll("-", "").slice(0, 8)}`;
  const base = baseSlug.slice(0, 120 - suffix.length).replace(/-+$/, "") || "event";
  return `${base}${suffix}`;
}

export function generateEventOccurrences(
  event: EventInput,
  baseSlug: string,
  eventId: string,
): GeneratedOccurrence[] {
  const recurrence = event.recurrence;
  if (!recurrence) return [];

  const start = easternDateAndTime(event.startsAt);
  const end = event.endsAt ? easternDateAndTime(event.endsAt) : null;
  const endDayOffset = end ? calendarDayDifference(start.date, end.date) : 0;
  const finalDate = recurrence.endDate;
  const targetCount = recurrence.count;
  const maximumTimestamp = Date.now() + 2 * 365 * 24 * 60 * 60_000;
  const dates: string[] = [start.date];

  if (recurrence.frequency === "monthly") {
    const anchor = dateAtUtc(start.date);
    for (
      let monthOffset = 1;
      dates.length < MAX_RECURRENCES && (!targetCount || dates.length < targetCount);
      monthOffset += 1
    ) {
      const candidate = new Date(Date.UTC(
        anchor.getUTCFullYear(),
        anchor.getUTCMonth() + monthOffset,
        anchor.getUTCDate(),
      ));
      const expectedMonth = (anchor.getUTCMonth() + monthOffset) % 12;
      if (candidate.getUTCMonth() !== (expectedMonth + 12) % 12) continue;
      const candidateText = formatDateOnly(candidate);
      if (finalDate && candidateText > finalDate) break;
      dates.push(candidateText);
      if (targetCount && dates.length >= targetCount) break;
    }
  } else {
    const weekdays = recurrence.weekdays ?? [];
    for (
      let dayOffset = 1;
      dates.length < MAX_RECURRENCES && (!targetCount || dates.length < targetCount);
      dayOffset += 1
    ) {
      const candidateText = addCalendarDays(start.date, dayOffset);
      if (finalDate && candidateText > finalDate) break;
      const candidate = dateAtUtc(candidateText);
      const weekOffset = Math.floor(dayOffset / 7);
      const onInterval = recurrence.frequency === "weekly" || weekOffset % 2 === 0;
      if (onInterval && weekdays.includes(candidate.getUTCDay())) dates.push(candidateText);
      if (targetCount && dates.length >= targetCount) break;
      if (dayOffset > 2 * 366) break;
    }
  }

  if (targetCount && dates.length !== targetCount) {
    throw new Error("This recurrence extends beyond the supported two-year range.");
  }
  if (finalDate) {
    const nextCandidateExists = dates.length === MAX_RECURRENCES && dates.at(-1)! < finalDate;
    if (nextCandidateExists) {
      throw new Error(`A recurring event may contain at most ${MAX_RECURRENCES} occurrences.`);
    }
  }

  return dates.map((date, occurrenceIndex) => {
    const startsAt = easternLocalDateTime(date, start.time, "Occurrence start");
    if (new Date(startsAt).getTime() > maximumTimestamp) {
      throw new Error("This recurrence extends beyond the supported two-year range.");
    }
    const endsAt = end
      ? easternLocalDateTime(addCalendarDays(date, endDayOffset), end.time, "Occurrence end")
      : undefined;
    return {
      occurrenceIndex,
      slug: occurrenceSlug(baseSlug, date, eventId),
      startsAt,
      ...(endsAt ? { endsAt } : {}),
    };
  });
}

export function parsePublicEventInput(input: Record<string, unknown>, hasImage: boolean) {
  return parseEventInput(input, hasImage, true);
}

export function parseManagedEventInput(input: Record<string, unknown>, hasImage: boolean) {
  return parseEventInput(input, hasImage, false);
}

export function validEventSlug(value: unknown) {
  const slug = text(value, 120, "Slug").toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Slug may contain lowercase letters, numbers, and single hyphens only.");
  }
  return slug;
}

export function validEventStatus(value: unknown): EventStatus | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === "cancelled" || value === "postponed") return value;
  throw new Error("Event status is invalid.");
}

export function validImagePosition(value: unknown) {
  const position = text(value, 40, "Image position", false).toLowerCase() || "center";
  const keywords = /^(left|center|right)( (top|center|bottom))?$/;
  const percentages = /^(100|\d{1,2})% (100|\d{1,2})%$/;
  if (!keywords.test(position) && !percentages.test(position)) {
    throw new Error("Image position is invalid.");
  }
  return position;
}

export function suggestedEventSlug(name: string, startsAt: string) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(startsAt));
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return `${base || "event"}-${date}`;
}

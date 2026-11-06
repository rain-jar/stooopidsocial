import type { EventStatus } from "@/data/events";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_ZONE = "America/Toronto";

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
  const startsAt = easternLocalDateTime(input.startDate, input.startTime, "Start");
  const endDate = text(input.endDate, 10, "End date", false);
  const endTime = text(input.endTime, 5, "End time", false);
  if (endDate && !endTime) {
    throw new Error("Provide an end time with the end date.");
  }
  const endsAt = endTime
    ? easternLocalDateTime(endDate || input.startDate, endTime, "End")
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
  };
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

import "server-only";

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { CommunityEvent, EventStatus } from "@/data/events";
import { events as fallbackEvents } from "@/data/events";
import {
  getGoogleConfiguration,
  googleFetch,
} from "@/lib/google-auth";

const EASTERN_TIME_ZONE = "America/Toronto";
const MAX_ROWS = 500;

type SheetValue = string | number | boolean | null | undefined;

type GoogleEvent = CommunityEvent & {
  driveFileId?: string;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type TimeParts = {
  hour: number;
  minute: number;
};

type SheetsResponse = {
  values?: SheetValue[][];
};

function cleanText(value: SheetValue, maximumLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maximumLength);
}

function cleanIdentifier(value: SheetValue, maximumLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, maximumLength);
}

function parsePublished(value: SheetValue) {
  return value === true ||
    (typeof value === "string" && value.trim().toLowerCase() === "true");
}

function parseDate(value: SheetValue): DateParts | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000);
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }

  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return check.getUTCFullYear() === parts.year &&
    check.getUTCMonth() + 1 === parts.month &&
    check.getUTCDate() === parts.day
    ? parts
    : null;
}

function parseTime(value: SheetValue): TimeParts | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const totalMinutes = Math.round(
      ((value % 1) + (value < 0 ? 1 : 0)) * 24 * 60,
    ) % (24 * 60);
    return {
      hour: Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
    };
  }

  if (typeof value !== "string") return null;
  const match = value
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase().replaceAll(".", "");

  if (minute > 59 || hour > (meridiem ? 12 : 23) || hour < 0) return null;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (meridiem === "pm" && hour !== 12) hour += 12;

  return { hour, minute };
}

function timezoneParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
}

function easternDateTime(date: DateParts, time: TimeParts) {
  const localAsUtc = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    time.hour,
    time.minute,
  );
  let guess = localAsUtc;

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const actual = timezoneParts(new Date(guess));
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

  return new Date(guess).toISOString();
}

function parseStatus(value: SheetValue): EventStatus | undefined | null {
  const status = cleanText(value, 30).toLowerCase();
  if (!status) return undefined;
  if (status === "cancelled" || status === "postponed") return status;
  return null;
}

function parseRsvpUrl(value: SheetValue) {
  const candidate = cleanText(value, 2_000);
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function parseImagePosition(value: SheetValue) {
  const position = cleanText(value, 40).toLowerCase();
  if (!position) return "center";
  const keywordPattern = /^(left|center|right)( top| center| bottom)?$/;
  const percentagePattern = /^\d{1,3}% \d{1,3}%$/;
  return keywordPattern.test(position) || percentagePattern.test(position)
    ? position
    : "center";
}

function parseRow(row: SheetValue[], rowNumber: number): GoogleEvent | null {
  if (!parsePublished(row[15])) return null;

  const id = cleanIdentifier(row[0], 100);
  const slug = cleanText(row[1], 120).toLowerCase();
  const name = cleanText(row[2], 160);
  const description = cleanText(row[3], 5_000);
  const startDate = parseDate(row[4]);
  const startTime = parseTime(row[5]);
  const endDate = parseDate(row[6]);
  const endTime = parseTime(row[7]);
  const venue = cleanText(row[8], 240);
  const address = cleanText(row[9], 400);
  const driveFileId = cleanText(row[10], 200);
  const imageAlt = cleanText(row[11], 300);
  const rsvpUrl = parseRsvpUrl(row[13]);
  const status = parseStatus(row[14]);

  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const validDriveId = !driveFileId || /^[A-Za-z0-9_-]{10,200}$/.test(driveFileId);
  if (
    !id ||
    !validSlug ||
    !name ||
    !description ||
    !startDate ||
    !startTime ||
    !venue ||
    !validDriveId ||
    rsvpUrl === null ||
    status === null
  ) {
    console.warn(`Skipped invalid published event row ${rowNumber}`);
    return null;
  }

  const event: GoogleEvent = {
    id,
    slug,
    name,
    description,
    startsAt: easternDateTime(startDate, startTime),
    timezone: EASTERN_TIME_ZONE,
    venue,
    artwork: "photo",
  };

  if (endTime) {
    event.endsAt = easternDateTime(endDate ?? startDate, endTime);
  }
  if (address) event.address = address;
  if (rsvpUrl) event.rsvpUrl = rsvpUrl;
  if (status) event.status = status;

  if (driveFileId) {
    const version = createHash("sha256").update(driveFileId).digest("hex").slice(0, 12);
    event.driveFileId = driveFileId;
    event.image = {
      src: `/api/event-images/${encodeURIComponent(slug)}/${version}`,
      alt: imageAlt,
      position: parseImagePosition(row[12]),
    };
  }

  return event;
}

async function fetchGoogleEvents(
  sheetId: string,
  sheetRange: string,
): Promise<GoogleEvent[]> {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(sheetRange)}`,
  );
  url.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  url.searchParams.set("dateTimeRenderOption", "SERIAL_NUMBER");

  const response = await googleFetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Google Sheets request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SheetsResponse;
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const events: GoogleEvent[] = [];

  for (const [index, row] of (payload.values ?? []).slice(0, MAX_ROWS).entries()) {
    const event = parseRow(row, index + 2);
    if (!event) continue;
    if (seenIds.has(event.id) || seenSlugs.has(event.slug)) {
      console.warn(`Skipped duplicate published event row ${index + 2}`);
      continue;
    }
    seenIds.add(event.id);
    seenSlugs.add(event.slug);
    events.push(event);
  }

  return events.sort(
    (first, second) =>
      new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
  );
}

const getCachedGoogleEvents = unstable_cache(fetchGoogleEvents, ["google-events-v3"], {
  revalidate: 300,
  tags: ["google-events"],
});

function getConfiguredGoogleEvents() {
  const { sheetId, sheetRange } = getGoogleConfiguration();
  return getCachedGoogleEvents(sheetId, sheetRange);
}

function publicEvent(event: GoogleEvent): CommunityEvent {
  const safeEvent = { ...event };
  delete safeEvent.driveFileId;
  return safeEvent;
}

export async function getEvents(): Promise<CommunityEvent[]> {
  try {
    return (await getConfiguredGoogleEvents()).map(publicEvent);
  } catch {
    console.error("Google event sync failed; using the local fallback dataset");
    return fallbackEvents;
  }
}

export async function getPublishedEventImage(slug: string) {
  const events = await getConfiguredGoogleEvents();
  const event = events.find((candidate) => candidate.slug === slug);
  return event?.driveFileId
    ? {
        fileId: event.driveFileId,
        version: createHash("sha256")
          .update(event.driveFileId)
          .digest("hex")
          .slice(0, 12),
      }
    : null;
}

import "server-only";

import { unstable_cache } from "next/cache";
import type { CommunityEvent, EventStatus, OrganizerType } from "@/data/events";
import { eventImageVersion } from "@/lib/events/images";
import { getAdminSupabaseClient, getPublicSupabaseClient } from "@/lib/supabase";
import type { RecurrenceFrequency } from "@/lib/events/validation";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type EventRow = {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  timezone: "America/Toronto";
  venue: string;
  address: string | null;
  rsvp_url: string | null;
  event_status: EventStatus | null;
  moderation_status?: ModerationStatus;
  image_path: string | null;
  image_alt: string | null;
  image_position: string;
  submitted_at?: string;
  reviewed_at?: string | null;
  updated_at: string;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_weekdays: number[] | null;
  recurrence_end_date: string | null;
  recurrence_count: number | null;
  organizer_type?: OrganizerType | null;
  organizer_name?: string | null;
};

type EventOccurrenceRow = {
  id: string;
  event_id: string;
  occurrence_index: number;
  slug: string;
  starts_at: string;
  ends_at: string | null;
};

const PUBLIC_COLUMNS_BASE = [
  "id", "slug", "name", "description", "starts_at", "ends_at", "timezone",
  "venue", "address", "rsvp_url", "event_status", "image_path", "image_alt",
  "image_position", "updated_at", "recurrence_frequency", "recurrence_weekdays",
  "recurrence_end_date", "recurrence_count",
].join(",");

const ORGANIZER_COLUMNS = "organizer_type,organizer_name";
const PUBLIC_COLUMNS = `${PUBLIC_COLUMNS_BASE},${ORGANIZER_COLUMNS}`;
const ADMIN_COLUMNS_BASE = `${PUBLIC_COLUMNS_BASE},moderation_status,submitted_at,reviewed_at`;
const ADMIN_COLUMNS = `${ADMIN_COLUMNS_BASE},${ORGANIZER_COLUMNS}`;

export function missingOrganizerColumns(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "42703" ||
    message.includes("organizer_type") ||
    message.includes("organizer_name")
  );
}

export function withoutOrganizerColumns<T extends { organizer_type?: unknown; organizer_name?: unknown }>(
  row: T,
) {
  const rest = { ...row };
  delete rest.organizer_type;
  delete rest.organizer_name;
  return rest;
}
const OCCURRENCE_PAGE_SIZE = 1_000;

function publicEvent(row: EventRow, occurrence?: EventOccurrenceRow): CommunityEvent | null {
  const slug = occurrence?.slug ?? row.slug;
  const endsAt = occurrence ? occurrence.ends_at : row.ends_at;
  if (!slug) return null;
  return {
    id: occurrence?.id ?? row.id,
    slug,
    name: row.name,
    description: row.description,
    startsAt: occurrence?.starts_at ?? row.starts_at,
    ...(endsAt ? { endsAt } : {}),
    timezone: row.timezone,
    venue: row.venue,
    ...(row.address ? { address: row.address } : {}),
    ...(row.rsvp_url ? { rsvpUrl: row.rsvp_url } : {}),
    ...(row.event_status ? { status: row.event_status } : {}),
    ...(row.image_path && row.image_alt
      ? {
          image: {
            src: `/api/event-images/${encodeURIComponent(row.slug!)}/${eventImageVersion(row.image_path)}`,
            alt: row.image_alt,
            position: row.image_position,
          },
        }
      : {}),
    artwork: "photo",
    ...(row.organizer_name
      ? {
          organizerName: row.organizer_name,
          organizerType: row.organizer_type === "shared" ? "shared" : "member",
        }
      : {}),
  };
}

async function selectApprovedEventRows(client: ReturnType<typeof getPublicSupabaseClient>) {
  const withOrganizer = await client
    .from("events")
    .select(PUBLIC_COLUMNS)
    .order("starts_at")
    .limit(500);
  if (!withOrganizer.error) return (withOrganizer.data ?? []) as unknown as EventRow[];
  if (!missingOrganizerColumns(withOrganizer.error)) {
    throw new Error("Approved events are temporarily unavailable.");
  }
  const fallback = await client
    .from("events")
    .select(PUBLIC_COLUMNS_BASE)
    .order("starts_at")
    .limit(500);
  if (fallback.error) throw new Error("Approved events are temporarily unavailable.");
  return (fallback.data ?? []) as unknown as EventRow[];
}

async function fetchApprovedEvents() {
  const client = getPublicSupabaseClient();
  const rows = await selectApprovedEventRows(client);
  const recurringIds = rows
    .filter((row) => row.recurrence_frequency)
    .map((row) => row.id);
  const occurrences: EventOccurrenceRow[] = [];
  for (let batchStart = 0; batchStart < recurringIds.length; batchStart += 50) {
    const batch = recurringIds.slice(batchStart, batchStart + 50);
    for (let offset = 0; ; offset += OCCURRENCE_PAGE_SIZE) {
      const { data: occurrenceData, error: occurrenceError } = await client
        .from("event_occurrences")
        .select("id,event_id,occurrence_index,slug,starts_at,ends_at")
        .in("event_id", batch)
        .order("starts_at")
        .range(offset, offset + OCCURRENCE_PAGE_SIZE - 1);
      if (occurrenceError) throw new Error("Approved events are temporarily unavailable.");
      const page = (occurrenceData ?? []) as unknown as EventOccurrenceRow[];
      occurrences.push(...page);
      if (page.length < OCCURRENCE_PAGE_SIZE) break;
      if (offset >= 2_000) {
        throw new Error("Approved event capacity was exceeded.");
      }
    }
  }

  const parents = new Map(rows.map((row) => [row.id, row]));
  return [
    ...rows.filter((row) => !row.recurrence_frequency).map((row) => publicEvent(row)),
    ...occurrences.map((occurrence) => {
      const parent = parents.get(occurrence.event_id);
      return parent ? publicEvent(parent, occurrence) : null;
    }),
  ]
    .filter((event): event is CommunityEvent => event !== null)
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
}

const getCachedApprovedEvents = unstable_cache(
  fetchApprovedEvents,
  ["supabase-events-v3"],
  { revalidate: 300, tags: ["supabase-events"] },
);

export function getApprovedSupabaseEvents() {
  return getCachedApprovedEvents();
}

export async function getManagedEvents() {
  const client = getAdminSupabaseClient();
  const withOrganizer = await client
    .from("events")
    .select(ADMIN_COLUMNS)
    .order("moderation_status")
    .order("submitted_at", { ascending: false })
    .limit(500);
  if (!withOrganizer.error) return (withOrganizer.data ?? []) as unknown as EventRow[];
  if (!missingOrganizerColumns(withOrganizer.error)) {
    throw new Error("Event management data is temporarily unavailable.");
  }
  const fallback = await client
    .from("events")
    .select(ADMIN_COLUMNS_BASE)
    .order("moderation_status")
    .order("submitted_at", { ascending: false })
    .limit(500);
  if (fallback.error) throw new Error("Event management data is temporarily unavailable.");
  return (fallback.data ?? []) as unknown as EventRow[];
}

export async function getApprovedSupabaseImage(slug: string) {
  const { data, error } = await getPublicSupabaseClient()
    .from("events")
    .select("image_path")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data?.image_path) return null;
  return {
    path: data.image_path as string,
    version: eventImageVersion(data.image_path as string),
  };
}

export async function getManagedEventImage(id: string) {
  const { data, error } = await getAdminSupabaseClient()
    .from("events")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  if (error || !data?.image_path) return null;
  return data.image_path as string;
}

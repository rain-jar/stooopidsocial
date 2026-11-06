import "server-only";

import { unstable_cache } from "next/cache";
import type { CommunityEvent, EventStatus } from "@/data/events";
import { eventImageVersion } from "@/lib/events/images";
import { getAdminSupabaseClient, getPublicSupabaseClient } from "@/lib/supabase";

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
};

const PUBLIC_COLUMNS = [
  "id", "slug", "name", "description", "starts_at", "ends_at", "timezone",
  "venue", "address", "rsvp_url", "event_status", "image_path", "image_alt",
  "image_position", "updated_at",
].join(",");

const ADMIN_COLUMNS = `${PUBLIC_COLUMNS},moderation_status,submitted_at,reviewed_at`;

function publicEvent(row: EventRow): CommunityEvent | null {
  if (!row.slug) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    startsAt: row.starts_at,
    ...(row.ends_at ? { endsAt: row.ends_at } : {}),
    timezone: row.timezone,
    venue: row.venue,
    ...(row.address ? { address: row.address } : {}),
    ...(row.rsvp_url ? { rsvpUrl: row.rsvp_url } : {}),
    ...(row.event_status ? { status: row.event_status } : {}),
    ...(row.image_path && row.image_alt
      ? {
          image: {
            src: `/api/event-images/${encodeURIComponent(row.slug)}/${eventImageVersion(row.image_path)}`,
            alt: row.image_alt,
            position: row.image_position,
          },
        }
      : {}),
    artwork: "photo",
  };
}

async function fetchApprovedEvents() {
  const { data, error } = await getPublicSupabaseClient()
    .from("events")
    .select(PUBLIC_COLUMNS)
    .order("starts_at")
    .limit(500);
  if (error) throw new Error("Approved events are temporarily unavailable.");
  return ((data ?? []) as unknown as EventRow[])
    .map(publicEvent)
    .filter((event): event is CommunityEvent => event !== null);
}

const getCachedApprovedEvents = unstable_cache(
  fetchApprovedEvents,
  ["supabase-events-v1"],
  { revalidate: 300, tags: ["supabase-events"] },
);

export function getApprovedSupabaseEvents() {
  return getCachedApprovedEvents();
}

export async function getManagedEvents() {
  const { data, error } = await getAdminSupabaseClient()
    .from("events")
    .select(ADMIN_COLUMNS)
    .order("moderation_status")
    .order("submitted_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Event management data is temporarily unavailable.");
  return (data ?? []) as unknown as EventRow[];
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

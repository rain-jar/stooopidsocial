import "server-only";

import type { CommunityEvent } from "@/data/events";
import { getApprovedSupabaseEvents } from "@/lib/events/repository";
import { getEvents as getGoogleEvents } from "@/lib/google-events";

export function eventSource() {
  return process.env.EVENTS_SOURCE === "supabase" ? "supabase" : "google";
}

export function eventSubmissionsEnabled() {
  return process.env.EVENT_SUBMISSIONS_ENABLED === "true";
}

function safeError(error: unknown) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`.slice(0, 300)
    : "unknown error";
}

export async function getEvents(): Promise<CommunityEvent[]> {
  if (eventSource() === "google") return getGoogleEvents();
  try {
    return await getApprovedSupabaseEvents();
  } catch (error) {
    console.error("Supabase event read failed:", safeError(error));
    if (process.env.EVENTS_GOOGLE_FALLBACK === "true") return getGoogleEvents();
    return [];
  }
}

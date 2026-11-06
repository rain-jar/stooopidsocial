import { NextResponse } from "next/server";
import {
  deleteEventImage,
  downloadEventImage,
} from "@/lib/events/images";
import { eventSubmissionsEnabled } from "@/lib/events/source";
import { readSubmissionToken, sameOrigin } from "@/lib/events/submission-security";
import { parsePublicEventInput } from "@/lib/events/validation";
import { getAdminSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

type FinalizeBody = {
  submissionToken?: unknown;
  event?: unknown;
};

function response(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!eventSubmissionsEnabled()) return response({ error: "Event submissions are unavailable." }, 503);
  if (!sameOrigin(request)) return response({ error: "Unable to submit this request." }, 403);
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    return response({ error: "Invalid request." }, 411);
  }
  if (contentLength > 32_768) return response({ error: "Invalid request." }, 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return response({ error: "Invalid request." }, 415);
  }

  let body: FinalizeBody;
  try {
    body = (await request.json()) as FinalizeBody;
  } catch {
    return response({ error: "Invalid request." }, 400);
  }
  const token = readSubmissionToken(body.submissionToken);
  if (!token || !body.event || typeof body.event !== "object" || Array.isArray(body.event)) {
    return response({ error: "This submission expired. Please try again." }, 400);
  }

  const client = getAdminSupabaseClient();
  const { data: prepared, error: preparedError } = await client
    .from("event_submission_tokens")
    .select("id,image_path,expires_at")
    .eq("id", token.id)
    .maybeSingle();
  if (
    preparedError ||
    !prepared ||
    prepared.image_path !== (token.path ?? null) ||
    new Date(prepared.expires_at).getTime() <= Date.now()
  ) {
    return response({ error: "This submission expired. Please try again." }, 400);
  }

  let eventInput;
  try {
    eventInput = parsePublicEventInput(
      body.event as Record<string, unknown>,
      Boolean(token.path),
    );
  } catch (error) {
    return response(
      { error: error instanceof Error ? error.message : "Check the event details and try again." },
      400,
    );
  }

  if (token.path && !(await downloadEventImage(token.path))) {
    await deleteEventImage(token.path);
    await client.from("event_submission_tokens").delete().eq("id", token.id);
    return response({ error: "The uploaded image could not be verified." }, 400);
  }

  const { error: insertError } = await client.from("events").insert({
    id: token.id,
    slug: null,
    name: eventInput.name,
    description: eventInput.description,
    starts_at: eventInput.startsAt,
    ends_at: eventInput.endsAt ?? null,
    timezone: eventInput.timezone,
    venue: eventInput.venue,
    address: eventInput.address ?? null,
    rsvp_url: eventInput.rsvpUrl ?? null,
    moderation_status: "pending",
    image_path: token.path ?? null,
    image_alt: eventInput.imageAlt ?? null,
    image_position: eventInput.imagePosition,
  });
  if (insertError) {
    return response({ error: "Unable to save the event. Please try again." }, 503);
  }

  await client.from("event_submission_tokens").delete().eq("id", token.id);
  return response({ ok: true }, 201);
}

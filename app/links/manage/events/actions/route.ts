import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { deleteEventImage } from "@/lib/events/images";
import { generateEventOccurrences, parseManagedEventInput, validEventSlug, validEventStatus, validImagePosition } from "@/lib/events/validation";
import { getAdminSession, verifyCsrf, verifySameOrigin } from "@/lib/links/auth";
import { isChecked, validUuid } from "@/lib/links/validation";
import { missingOrganizerColumns, withoutOrganizerColumns } from "@/lib/events/repository";
import { getAdminSupabaseClient } from "@/lib/supabase";

function destination(request: Request, result: "success" | "error") {
  return NextResponse.redirect(new URL(`/links/manage/events?${result}=1`, request.url), 303);
}

function formRecord(formData: FormData) {
  return {
    ...Object.fromEntries(
    [
      "name", "description", "startDate", "startTime", "endDate", "endTime",
      "venue", "address", "rsvpUrl", "imageAlt", "recurrenceFrequency",
      "recurrenceEndType", "recurrenceEndDate", "recurrenceCount",
      "organizerName", "organizerType",
    ].map((key) => [key, formData.get(key)]),
    ),
    recurring: formData.get("recurring"),
    recurrenceWeekdays: formData.getAll("recurrenceWeekdays"),
  };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return new NextResponse("Length required", { status: 411 });
  if (contentLength > 65_536) return new NextResponse("Payload too large", { status: 413 });
  const session = await getAdminSession();
  const formData = await request.formData();
  if (!session || !(await verifySameOrigin(request)) || !verifyCsrf(session, formData.get("csrf"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const client = getAdminSupabaseClient();
  let imagePath: string | null = null;
  let error: unknown;
  try {
    const id = validUuid(formData.get("id"));
    const action = formData.get("action");
    const { data: current, error: currentError } = await client
      .from("events")
      .select("image_path,moderation_status")
      .eq("id", id)
      .single();
    if (currentError || !current) throw new Error("Event not found.");
    imagePath = current.image_path as string | null;

    if (action === "reject") {
      if (!isChecked(formData.get("confirm"))) throw new Error("Confirmation required.");
      const { error: occurrenceError } = await client
        .from("event_occurrences")
        .delete()
        .eq("event_id", id);
      if (occurrenceError) throw occurrenceError;
      const { error: updateError } = await client.from("events").update({
        moderation_status: "rejected",
        reviewed_at: new Date().toISOString(),
        image_path: null,
        image_alt: null,
      }).eq("id", id);
      if (updateError) throw updateError;
      await deleteEventImage(imagePath);
    } else if (action === "delete") {
      if (!isChecked(formData.get("confirm"))) throw new Error("Confirmation required.");
      const { error: deleteError } = await client.from("events").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await deleteEventImage(imagePath);
    } else if (action === "update" || action === "approve") {
      const event = parseManagedEventInput(formRecord(formData), Boolean(imagePath));
      const slug = validEventSlug(formData.get("slug"));
      const imagePosition = validImagePosition(formData.get("imagePosition"));
      const shouldPublish = action === "approve" || current.moderation_status === "approved";
      const occurrences = shouldPublish
        ? generateEventOccurrences(event, slug, id)
        : [];
      const values = {
        slug,
        name: event.name,
        description: event.description,
        starts_at: event.startsAt,
        ends_at: event.endsAt ?? null,
        timezone: event.timezone,
        venue: event.venue,
        address: event.address ?? null,
        rsvp_url: event.rsvpUrl ?? null,
        event_status: validEventStatus(formData.get("eventStatus")) ?? null,
        image_alt: event.imageAlt ?? null,
        image_position: imagePosition,
        recurrence_frequency: event.recurrence?.frequency ?? null,
        recurrence_weekdays: event.recurrence?.weekdays ?? null,
        recurrence_end_date: event.recurrence?.endDate ?? null,
        recurrence_count: event.recurrence?.count ?? null,
        organizer_type: event.organizerType ?? null,
        organizer_name: event.organizerName ?? null,
        ...(shouldPublish ? { moderation_status: "pending" } : {}),
      };
      let { error: updateError } = await client.from("events").update(values).eq("id", id);
      if (updateError && missingOrganizerColumns(updateError)) {
        ({ error: updateError } = await client
          .from("events")
          .update(withoutOrganizerColumns(values))
          .eq("id", id));
      }
      if (updateError) throw updateError;
      if (shouldPublish) {
        const { error: occurrenceError } = await client.rpc("replace_event_occurrences", {
          p_event_id: id,
          p_occurrences: occurrences.map((occurrence) => ({
            occurrence_index: occurrence.occurrenceIndex,
            slug: occurrence.slug,
            starts_at: occurrence.startsAt,
            ends_at: occurrence.endsAt ?? null,
          })),
          p_publish: true,
        });
        if (occurrenceError) throw occurrenceError;
      } else {
        const { error: occurrenceError } = await client
          .from("event_occurrences")
          .delete()
          .eq("event_id", id);
        if (occurrenceError) throw occurrenceError;
      }
    } else {
      throw new Error("Unknown action.");
    }
  } catch (caught) {
    error = caught;
  }

  if (error) return destination(request, "error");
  revalidateTag("supabase-events", "max");
  revalidatePath("/");
  revalidatePath("/links/manage/events");
  return destination(request, "success");
}

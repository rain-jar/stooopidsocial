import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { deleteEventImage } from "@/lib/events/images";
import { parseManagedEventInput, validEventSlug, validEventStatus, validImagePosition } from "@/lib/events/validation";
import { getAdminSession, verifyCsrf, verifySameOrigin } from "@/lib/links/auth";
import { isChecked, validUuid } from "@/lib/links/validation";
import { getAdminSupabaseClient } from "@/lib/supabase";

function destination(request: Request, result: "success" | "error") {
  return NextResponse.redirect(new URL(`/links/manage/events?${result}=1`, request.url), 303);
}

function formRecord(formData: FormData) {
  return Object.fromEntries(
    [
      "name", "description", "startDate", "startTime", "endDate", "endTime",
      "venue", "address", "rsvpUrl", "imageAlt",
    ].map((key) => [key, formData.get(key)]),
  );
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
        ...(action === "approve"
          ? { moderation_status: "approved", reviewed_at: new Date().toISOString() }
          : {}),
      };
      const { error: updateError } = await client.from("events").update(values).eq("id", id);
      if (updateError) throw updateError;
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

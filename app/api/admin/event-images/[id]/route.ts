import { getAdminSession } from "@/lib/links/auth";
import { downloadEventImage } from "@/lib/events/images";
import { getManagedEventImage } from "@/lib/events/repository";

export const runtime = "nodejs";

function unavailable(status = 404) {
  return new Response("Event image unavailable", {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession())) return unavailable(403);
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return unavailable();
  }
  try {
    const path = await getManagedEventImage(id);
    if (!path) return unavailable();
    const image = await downloadEventImage(path);
    if (!image) return unavailable();
    return new Response(image.content, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Length": String(image.content.byteLength),
        "Content-Type": image.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return unavailable(503);
  }
}

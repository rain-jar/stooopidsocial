import { getGoogleConfiguration, googleFetch } from "@/lib/google-auth";
import { getPublishedEventImage } from "@/lib/google-events";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type DriveFileMetadata = {
  mimeType?: string;
  parents?: string[];
  size?: string;
  trashed?: boolean;
};

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
  { params }: { params: Promise<{ slug: string; version: string }> },
) {
  try {
    const { slug, version } = await params;
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      !/^[a-f0-9]{12}$/.test(version)
    ) {
      return unavailable();
    }

    const source = await getPublishedEventImage(slug);
    if (!source || source.version !== version) return unavailable();

    const { driveFolderId } = getGoogleConfiguration();
    const metadataUrl = new URL(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(source.fileId)}`,
    );
    metadataUrl.searchParams.set("fields", "mimeType,parents,size,trashed");
    metadataUrl.searchParams.set("supportsAllDrives", "true");

    const metadataResponse = await googleFetch(metadataUrl.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!metadataResponse.ok) return unavailable();

    const metadata = (await metadataResponse.json()) as DriveFileMetadata;
    const size = Number(metadata.size ?? Number.NaN);
    if (
      metadata.trashed ||
      !metadata.mimeType ||
      !ALLOWED_IMAGE_TYPES.has(metadata.mimeType) ||
      !metadata.parents?.includes(driveFolderId) ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > MAX_IMAGE_BYTES
    ) {
      return unavailable();
    }

    const contentUrl = new URL(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(source.fileId)}`,
    );
    contentUrl.searchParams.set("alt", "media");
    contentUrl.searchParams.set("supportsAllDrives", "true");
    const contentResponse = await googleFetch(contentUrl.toString());
    if (!contentResponse.ok) return unavailable(502);

    const content = await contentResponse.arrayBuffer();
    if (content.byteLength !== size || content.byteLength > MAX_IMAGE_BYTES) {
      return unavailable();
    }

    return new Response(content, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Length": String(content.byteLength),
        "Content-Type": metadata.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return unavailable(503);
  }
}

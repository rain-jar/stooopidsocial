import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  EVENT_IMAGE_BUCKET,
  MAX_EVENT_IMAGE_BYTES,
} from "@/lib/events/images";
import { eventSubmissionsEnabled } from "@/lib/events/source";
import {
  createSubmissionToken,
  requestIdentifier,
  sameOrigin,
  verifyTurnstile,
} from "@/lib/events/submission-security";
import { getAdminSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

type PrepareBody = {
  turnstileToken?: unknown;
  website?: unknown;
  hasImage?: unknown;
  imageType?: unknown;
  imageSize?: unknown;
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
  if (contentLength > 8_192) return response({ error: "Invalid request." }, 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return response({ error: "Invalid request." }, 415);
  }

  let body: PrepareBody;
  try {
    body = (await request.json()) as PrepareBody;
  } catch {
    return response({ error: "Invalid request." }, 400);
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return response({ error: "Unable to submit this request." }, 400);
  }
  const client = getAdminSupabaseClient();
  const { data: limits, error: limitError } = await client.rpc(
    "event_submission_consume_limit",
    { p_identifier_hash: requestIdentifier(request) },
  );
  if (limitError || !limits?.[0]?.allowed) {
    return response(
      {
        error: "Too many submissions. Please try again later.",
        retryAfter: limits?.[0]?.retry_after_seconds ?? 3_600,
      },
      429,
    );
  }
  if (!(await verifyTurnstile(request, body.turnstileToken))) {
    return response({ error: "Please complete the verification and try again." }, 400);
  }

  const { data: expiredTokens } = await client
    .from("event_submission_tokens")
    .select("id,image_path")
    .lt("expires_at", new Date().toISOString())
    .limit(20);
  if (expiredTokens?.length) {
    const withoutImages = expiredTokens.filter((token) => !token.image_path);
    const withImages = expiredTokens.filter((token) => Boolean(token.image_path));
    const expiredPaths = withImages.map((token) => token.image_path as string);
    const removableIds = withoutImages.map((token) => token.id);
    if (expiredPaths.length) {
      const { error: removeError } = await client.storage.from(EVENT_IMAGE_BUCKET).remove(expiredPaths);
      if (!removeError) removableIds.push(...withImages.map((token) => token.id));
    }
    if (removableIds.length) {
      await client
        .from("event_submission_tokens")
        .delete()
        .in("id", removableIds);
    }
  }

  const hasImage = body.hasImage === true;
  if (
    hasImage &&
    (body.imageType !== "image/webp" ||
      !Number.isSafeInteger(body.imageSize) ||
      Number(body.imageSize) <= 0 ||
      Number(body.imageSize) > MAX_EVENT_IMAGE_BYTES)
  ) {
    return response({ error: "The processed image is invalid or too large." }, 400);
  }

  const id = randomUUID();
  const path = hasImage
    ? `submissions/${id}/${randomBytes(16).toString("hex")}.webp`
    : undefined;
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  const { error: tokenError } = await client.from("event_submission_tokens").insert({
    id,
    image_path: path ?? null,
    expires_at: expiresAt,
  });
  if (tokenError) return response({ error: "Unable to prepare this submission." }, 503);

  if (!path) {
    return response({ submissionToken: createSubmissionToken(id) }, 200);
  }

  const { data: upload, error: uploadError } = await client
    .storage
    .from(EVENT_IMAGE_BUCKET)
    .createSignedUploadUrl(path);
  if (uploadError || !upload?.token) {
    await client.from("event_submission_tokens").delete().eq("id", id);
    return response({ error: "Unable to prepare the image upload." }, 503);
  }

  return response(
    {
      submissionToken: createSubmissionToken(id, path),
      upload: { path, token: upload.token },
    },
    200,
  );
}

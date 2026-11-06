import "server-only";

import { createHash } from "node:crypto";
import { getAdminSupabaseClient } from "@/lib/supabase";

export const EVENT_IMAGE_BUCKET = "event-images";
export const MAX_EVENT_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function eventImageVersion(path: string) {
  return createHash("sha256").update(path).digest("hex").slice(0, 12);
}

export function validEventImagePath(path: string) {
  return /^submissions\/[0-9a-f-]{36}\/[0-9a-f]{32}\.(webp|png|jpe?g)$/.test(path);
}

export function detectedImageType(bytes: Uint8Array) {
  if (bytes.length >= 12) {
    const ascii = (start: number, end: number) =>
      String.fromCharCode(...bytes.slice(start, end));
    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  }
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

export async function downloadEventImage(path: string) {
  if (!validEventImagePath(path)) return null;
  const { data, error } = await getAdminSupabaseClient()
    .storage
    .from(EVENT_IMAGE_BUCKET)
    .download(path);
  if (error || !data || data.size <= 0 || data.size > MAX_EVENT_IMAGE_BYTES) return null;
  const content = new Uint8Array(await data.arrayBuffer());
  const contentType = detectedImageType(content);
  if (!contentType || !IMAGE_TYPES.has(contentType)) return null;
  return { content, contentType };
}

export async function deleteEventImage(path?: string | null) {
  if (!path || !validEventImagePath(path)) return;
  await getAdminSupabaseClient().storage.from(EVENT_IMAGE_BUCKET).remove([path]);
}

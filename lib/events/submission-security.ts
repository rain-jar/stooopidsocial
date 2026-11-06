import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type SubmissionTokenPayload = {
  id: string;
  path?: string;
  exp: number;
};

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function signature(value: string) {
  return createHmac("sha256", requiredEnvironmentValue("EVENT_SUBMISSION_TOKEN_SECRET"))
    .update(value)
    .digest("base64url");
}

function equal(left: string, right: string) {
  const first = Buffer.from(left);
  const second = Buffer.from(right);
  return first.length === second.length && timingSafeEqual(first, second);
}

export function createSubmissionToken(id: string, path?: string) {
  const payload: SubmissionTokenPayload = {
    id,
    ...(path ? { path } : {}),
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function readSubmissionToken(value: unknown): SubmissionTokenPayload | null {
  if (typeof value !== "string") return null;
  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra || !equal(signature(encoded), suppliedSignature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SubmissionTokenPayload;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.id) ||
      !Number.isSafeInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000) ||
      (payload.path !== undefined && typeof payload.path !== "string")
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function requestIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 300);
  return createHmac("sha256", requiredEnvironmentValue("EVENT_SUBMISSION_RATE_LIMIT_SECRET"))
    .update(`${ip}\n${userAgent}`)
    .digest("hex");
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function verifyTurnstile(request: Request, token: unknown) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret && process.env.NODE_ENV !== "production") return true;
  if (!secret || typeof token !== "string" || !token) return false;
  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) return false;
  const result = (await response.json()) as {
    success?: boolean;
    action?: string;
    hostname?: string;
  };
  const expectedHostname = new URL(request.url).hostname;
  return result.success === true &&
    result.action === "event_submission" &&
    result.hostname === expectedHostname;
}

import "server-only";

import { createHmac, pbkdf2 as pbkdf2Callback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";

const pbkdf2 = promisify(pbkdf2Callback);
const COOKIE_NAME = "stooopid_links_admin";
const SESSION_SECONDS = 8 * 60 * 60;

type SessionPayload = { exp: number; nonce: string };

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", env("LINKS_ADMIN_SESSION_SECRET")).update(value).digest("base64url");
}

function equalStrings(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function verifyPasscode(passcode: string) {
  const [scheme, iterationsRaw, salt, expected] = env("LINKS_ADMIN_PASSCODE_HASH").split(":");
  const iterations = Number(iterationsRaw);
  if (scheme !== "pbkdf2_sha256" || !Number.isSafeInteger(iterations) || iterations < 210_000 || !salt || !expected) {
    throw new Error("Invalid passcode hash configuration.");
  }
  const actual = await pbkdf2(passcode, Buffer.from(salt, "base64url"), iterations, 32, "sha256");
  return equalStrings(actual.toString("base64url"), expected);
}

export function createSessionValue() {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    nonce: randomBytes(18).toString("base64url"),
  };
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function readSession(value?: string): SessionPayload | null {
  if (!value) return null;
  const [encoded, signature, extra] = value.split(".");
  if (!encoded || !signature || extra || !equalStrings(sign(encoded), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!Number.isSafeInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000) || typeof payload.nonce !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  return readSession((await cookies()).get(COOKIE_NAME)?.value);
}

export async function setAdminSession(value: string) {
  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/links/manage",
    maxAge: SESSION_SECONDS,
    priority: "high",
  });
}

export async function clearAdminSession() {
  (await cookies()).set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/links/manage",
    maxAge: 0,
  });
}

export function csrfToken(session: SessionPayload) {
  return sign(`csrf:${session.nonce}`);
}

export function verifyCsrf(session: SessionPayload, token: FormDataEntryValue | null) {
  return typeof token === "string" && equalStrings(csrfToken(session), token);
}

export async function verifySameOrigin(request: Request) {
  const origin = (await headers()).get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function loginIdentifier() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const userAgent = (requestHeaders.get("user-agent") || "unknown").slice(0, 300);
  return createHmac("sha256", env("LINKS_ADMIN_RATE_LIMIT_SECRET")).update(`${ip}\n${userAgent}`).digest("hex");
}

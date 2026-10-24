import { NextResponse } from "next/server";
import { createSessionValue, loginIdentifier, setAdminSession, verifyPasscode, verifySameOrigin } from "@/lib/links/auth";
import { getAdminLinksClient } from "@/lib/links/supabase";

function destination(request: Request, value: string) {
  return new URL(`/links/manage${value}`, request.url);
}
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return new NextResponse("Length required", { status: 411 });
  if (contentLength > 4096) return new NextResponse("Payload too large", { status: 413 });
  if (!(await verifySameOrigin(request))) return new NextResponse("Forbidden", { status: 403 });
  const formData = await request.formData();
  const passcode = typeof formData.get("passcode") === "string" ? String(formData.get("passcode")).slice(0, 256) : "";
  const identifier = await loginIdentifier();
  const client = getAdminLinksClient();

  const { data: limits, error: limitError } = await client.rpc("links_admin_check_login_limit", { p_identifier_hash: identifier });
  if (limitError || !limits?.[0]?.allowed) {
    return NextResponse.redirect(destination(request, "?error=limited"), 303);
  }

  let valid = false;
  try { valid = await verifyPasscode(passcode); }
  catch { return NextResponse.redirect(destination(request, "?error=invalid"), 303); }

  if (!valid) {
    const { error: recordError } = await client.rpc("links_admin_record_login_failure", { p_identifier_hash: identifier });
    if (recordError) return NextResponse.redirect(destination(request, "?error=limited"), 303);
    return NextResponse.redirect(destination(request, "?error=invalid"), 303);
  }

  const { error: clearError } = await client.rpc("links_admin_clear_login_limit", { p_identifier_hash: identifier });
  if (clearError) return NextResponse.redirect(destination(request, "?error=limited"), 303);
  await setAdminSession(createSessionValue());
  return NextResponse.redirect(destination(request, ""), 303);
}

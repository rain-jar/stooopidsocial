import { NextResponse } from "next/server";
import { clearAdminSession, getAdminSession, verifyCsrf, verifySameOrigin } from "@/lib/links/auth";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return new NextResponse("Length required", { status: 411 });
  if (contentLength > 4096) return new NextResponse("Payload too large", { status: 413 });
  const session = await getAdminSession();
  const formData = await request.formData();
  if (!session || !(await verifySameOrigin(request)) || !verifyCsrf(session, formData.get("csrf"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  await clearAdminSession();
  return NextResponse.redirect(new URL("/links/manage", request.url), 303);
}

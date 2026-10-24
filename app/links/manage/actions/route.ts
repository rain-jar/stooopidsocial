import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession, verifyCsrf, verifySameOrigin } from "@/lib/links/auth";
import { getAdminLinksClient } from "@/lib/links/supabase";
import { isChecked, optionalText, requiredText, validHttpUrl, validSlug, validUuid } from "@/lib/links/validation";

type Direction = "up" | "down";

function redirect(request: Request, result: "success" | "error") {
  return NextResponse.redirect(new URL(`/links/manage?${result}=1`, request.url), 303);
}
async function nextSortOrder(table: "links" | "link_categories", categoryId?: string) {
  let query = getAdminLinksClient().from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (table === "links" && categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw new Error("Unable to determine order.");
  return (data?.[0]?.sort_order ?? 0) + 10;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return new NextResponse("Length required", { status: 411 });
  if (contentLength > 32_768) return new NextResponse("Payload too large", { status: 413 });
  const session = await getAdminSession();
  const formData = await request.formData();
  if (!session || !(await verifySameOrigin(request)) || !verifyCsrf(session, formData.get("csrf"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const client = getAdminLinksClient();
  const action = formData.get("action");
  let error: unknown;

  try {
    if (action === "create-category") {
      const { error: dbError } = await client.from("link_categories").insert({
        name: requiredText(formData.get("name"), 80, "Name"),
        slug: validSlug(formData.get("slug")),
        sort_order: await nextSortOrder("link_categories"),
        is_visible: true,
      });
      error = dbError;
    } else if (action === "update-category") {
      const { error: dbError } = await client.from("link_categories").update({
        name: requiredText(formData.get("name"), 80, "Name"),
        slug: validSlug(formData.get("slug")),
        is_visible: isChecked(formData.get("is_visible")),
      }).eq("id", validUuid(formData.get("id")));
      error = dbError;
    } else if (action === "delete-category") {
      if (!isChecked(formData.get("confirm"))) throw new Error("Confirmation required.");
      const { error: dbError } = await client.from("link_categories").delete().eq("id", validUuid(formData.get("id")));
      error = dbError;
    } else if (action === "reorder-category") {
      const direction = requiredText(formData.get("direction"), 4, "Direction") as Direction;
      if (!(["up", "down"] as string[]).includes(direction)) throw new Error("Invalid direction.");
      const { error: dbError } = await client.rpc("reorder_link_category", { p_id: validUuid(formData.get("id")), p_direction: direction });
      error = dbError;
    } else if (action === "create-link") {
      const categoryId = validUuid(formData.get("category_id"), "Category");
      const { error: dbError } = await client.from("links").insert({
        title: requiredText(formData.get("title"), 180, "Title"),
        url: validHttpUrl(formData.get("url")),
        icon: optionalText(formData.get("icon"), 24, "Icon"),
        category_id: categoryId,
        sort_order: await nextSortOrder("links", categoryId),
        is_visible: isChecked(formData.get("is_visible")),
      });
      error = dbError;
    } else if (action === "update-link") {
      const id = validUuid(formData.get("id"));
      const categoryId = validUuid(formData.get("category_id"), "Category");
      const { data: current, error: currentError } = await client.from("links").select("category_id").eq("id", id).single();
      if (currentError || !current) throw new Error("Link not found.");
      const { error: dbError } = await client.from("links").update({
        title: requiredText(formData.get("title"), 180, "Title"),
        url: validHttpUrl(formData.get("url")),
        icon: optionalText(formData.get("icon"), 24, "Icon"),
        category_id: categoryId,
        ...(current.category_id === categoryId ? {} : { sort_order: await nextSortOrder("links", categoryId) }),
        is_visible: isChecked(formData.get("is_visible")),
      }).eq("id", id);
      error = dbError;
    } else if (action === "delete-link") {
      if (!isChecked(formData.get("confirm"))) throw new Error("Confirmation required.");
      const { error: dbError } = await client.from("links").delete().eq("id", validUuid(formData.get("id")));
      error = dbError;
    } else if (action === "reorder-link") {
      const direction = requiredText(formData.get("direction"), 4, "Direction") as Direction;
      if (!(["up", "down"] as string[]).includes(direction)) throw new Error("Invalid direction.");
      const { error: dbError } = await client.rpc("reorder_link", { p_id: validUuid(formData.get("id")), p_direction: direction });
      error = dbError;
    } else {
      throw new Error("Unknown action.");
    }
  } catch (caught) {
    error = caught;
  }

  if (error) return redirect(request, "error");
  revalidatePath("/links");
  revalidatePath("/links/manage");
  return redirect(request, "success");
}

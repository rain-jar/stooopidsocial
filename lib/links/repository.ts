import "server-only";

import { getAdminLinksClient, getPublicLinksClient } from "./supabase";
import type { LinkCategory, ManagedLink, PublicLinkCategory } from "./types";

export async function getPublicLinkCategories(): Promise<PublicLinkCategory[]> {
  const client = getPublicLinksClient();
  const [{ data: categories, error: categoryError }, { data: links, error: linksError }] = await Promise.all([
    client.from("link_categories").select("id,name,slug,sort_order,is_visible").order("sort_order").order("created_at"),
    client.from("links").select("id,title,url,icon,category_id,sort_order,is_visible").order("sort_order").order("created_at"),
  ]);

  if (categoryError || linksError) throw new Error("Links are temporarily unavailable.");
  const publicLinks = (links ?? []) as ManagedLink[];
  return ((categories ?? []) as LinkCategory[]).map((category) => ({
    ...category,
    links: publicLinks.filter((link) => link.category_id === category.id),
  }));
}
export async function getAllLinkContent() {
  const client = getAdminLinksClient();
  const [{ data: categories, error: categoryError }, { data: links, error: linksError }] = await Promise.all([
    client.from("link_categories").select("id,name,slug,sort_order,is_visible").order("sort_order").order("created_at"),
    client.from("links").select("id,title,url,icon,category_id,sort_order,is_visible").order("sort_order").order("created_at"),
  ]);
  if (categoryError || linksError) throw new Error("Unable to load link management data.");
  return { categories: (categories ?? []) as LinkCategory[], links: (links ?? []) as ManagedLink[] };
}

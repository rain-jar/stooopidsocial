const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function requiredText(value: FormDataEntryValue | null, max: number, label: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > max) throw new Error(`${label} must be between 1 and ${max} characters.`);
  return text;
}
export function optionalText(value: FormDataEntryValue | null, max: number, label: string) {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  if (text.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return text;
}

export function validUuid(value: FormDataEntryValue | null, label = "ID") {
  const id = requiredText(value, 36, label);
  if (!UUID_PATTERN.test(id)) throw new Error(`${label} is invalid.`);
  return id;
}

export function validSlug(value: FormDataEntryValue | null) {
  const slug = requiredText(value, 80, "Slug").toLowerCase();
  if (!SLUG_PATTERN.test(slug)) throw new Error("Slug may contain lowercase letters, numbers, and single hyphens only.");
  return slug;
}

export function validHttpUrl(value: FormDataEntryValue | null) {
  const raw = requiredText(value, 2048, "URL");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Enter a complete web address.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS links are allowed.");
  }
  if (!parsed.hostname) throw new Error("Enter a valid web address.");
  return parsed.toString();
}

export function isChecked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

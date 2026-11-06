import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const TIME_ZONE = "America/Toronto";
const BUCKET = "event-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const apply = process.argv.includes("--apply");
const positional = process.argv.slice(2).filter((value) => value !== "--apply");
const csvPath = positional[0] ? resolve(positional[0]) : null;
const imagesDirectory = positional[1] ? resolve(positional[1]) : null;

if (!csvPath) {
  throw new Error("Usage: npm run migrate:events -- path/to/Events.csv [images-directory] [--apply]");
}

function requiredEnvironmentValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  return rows;
}

function clean(value, maximum) {
  return String(value ?? "").trim().slice(0, maximum);
}

function stableUuid(value) {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

function easternParts(date) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

function easternDateTime(dateValue, timeValue) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean(dateValue, 10));
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?$/i.exec(clean(timeValue, 20));
  if (!dateMatch || !timeMatch) throw new Error("Invalid event date or time.");
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3]?.toLowerCase().replaceAll(".", "");
  if (meridiem === "am" && hour === 12) hour = 0;
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (hour > 23 || minute > 59) throw new Error("Invalid event time.");
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = easternParts(new Date(guess));
    const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    guess -= actualUtc - target;
  }
  return new Date(guess).toISOString();
}

function imageType(bytes, extension) {
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return { type: "image/webp", extension: "webp" };
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { type: "image/png", extension: "png" };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: "image/jpeg", extension: extension === ".jpeg" ? "jpeg" : "jpg" };
  throw new Error("Unsupported image signature.");
}

async function imageFilesByDriveId() {
  const files = new Map();
  if (!imagesDirectory) return files;
  for (const filename of await readdir(imagesDirectory)) {
    const extension = extname(filename).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension)) continue;
    files.set(basename(filename, extension), join(imagesDirectory, filename));
  }
  return files;
}

const rows = parseCsv(await readFile(csvPath, "utf8"));
if (rows.length < 2) throw new Error("CSV contains no event rows.");
const headers = rows[0].map((header) => clean(header, 100).toLowerCase());
const expected = ["id", "slug", "name", "description", "start_date", "start_time", "end_date", "end_time", "venue", "address", "drive_file_id", "image_alt", "image_position", "rsvp_url", "status", "published"];
if (!expected.every((header, index) => headers[index] === header)) {
  throw new Error("CSV columns do not match the documented Events sheet contract.");
}

const imageFiles = await imageFilesByDriveId();
const prepared = [];
for (const [index, row] of rows.slice(1).entries()) {
  if (clean(row[15], 20).toLowerCase() !== "true") continue;
  try {
    const legacyId = clean(row[0], 100);
    const id = stableUuid(`google-event:${legacyId}`);
    const slug = clean(row[1], 120).toLowerCase();
    const startsAt = easternDateTime(row[4], row[5]);
    const endsAt = clean(row[7], 20) ? easternDateTime(clean(row[6], 10) || clean(row[4], 10), row[7]) : null;
    const driveId = clean(row[10], 200);
    const localImage = driveId ? imageFiles.get(driveId) : undefined;
    let image;
    if (localImage) {
      const bytes = await readFile(localImage);
      if (bytes.length <= 0 || bytes.length > MAX_IMAGE_BYTES) throw new Error("Image exceeds the 5 MB migration limit.");
      const detected = imageType(bytes, extname(localImage).toLowerCase());
      const objectHash = createHash("sha256").update(bytes).digest("hex").slice(0, 32);
      image = {
        bytes,
        type: detected.type,
        path: `submissions/${id}/${objectHash}.${detected.extension}`,
      };
    }
    const rsvp = clean(row[13], 2048);
    if (rsvp && !/^https?:\/\//i.test(rsvp)) throw new Error("Invalid RSVP URL.");
    const status = clean(row[14], 30).toLowerCase();
    if (status && !["cancelled", "postponed"].includes(status)) throw new Error("Invalid event status.");
    const imagePosition = clean(row[12], 40).toLowerCase() || "center";
    if (!/^(left|center|right)( (top|center|bottom))?$/.test(imagePosition) && !/^(100|\d{1,2})% (100|\d{1,2})%$/.test(imagePosition)) {
      throw new Error("Invalid image position.");
    }
    if (!legacyId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid event identifier.");
    const name = clean(row[2], 160);
    const description = clean(row[3], 5000);
    const venue = clean(row[8], 240);
    const imageAlt = image ? clean(row[11], 300) : null;
    if (!name || !description || !venue) throw new Error("Required event content is missing.");
    if (image && !imageAlt) throw new Error("An imported image requires alt text.");
    prepared.push({
      image,
      record: {
        id,
        legacy_source_id: legacyId,
        slug,
        name,
        description,
        starts_at: startsAt,
        ends_at: endsAt,
        timezone: TIME_ZONE,
        venue,
        address: clean(row[9], 400) || null,
        rsvp_url: rsvp || null,
        event_status: status || null,
        moderation_status: "approved",
        image_path: image?.path || null,
        image_alt: imageAlt,
        image_position: imagePosition,
        reviewed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw new Error(`CSV row ${index + 2} is invalid: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

console.log(`Validated ${prepared.length} published event records.`);
if (!apply) {
  console.log("Dry run complete. Add --apply to upload and upsert the validated records.");
  process.exit(0);
}

const client = createClient(
  requiredEnvironmentValue("SUPABASE_URL"),
  requiredEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

for (const item of prepared) {
  if (item.image) {
    const { error: uploadError } = await client.storage.from(BUCKET).upload(
      item.image.path,
      item.image.bytes,
      { contentType: item.image.type, upsert: true },
    );
    if (uploadError) throw new Error("An approved event image could not be uploaded.");
  }
  const { error } = await client.from("events").upsert(item.record, { onConflict: "legacy_source_id" });
  if (error) throw new Error("An approved event record could not be imported.");
}

console.log(`Imported ${prepared.length} approved event records.`);

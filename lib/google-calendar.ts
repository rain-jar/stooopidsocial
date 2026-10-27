import type { CommunityEvent } from "@/data/events";

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;

function googleCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function googleCalendarUrl(event: CommunityEvent) {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${googleCalendarDate(start)}/${googleCalendarDate(end)}`,
    ctz: event.timezone,
    details: event.description,
    location: event.address ?? event.venue,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

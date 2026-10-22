import type { CommunityEvent } from "@/data/events";

export const EASTERN_TIME_ZONE = "America/Toronto";

function formatter(
  timezone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    ...options,
  });
}

export function formatDateBadge(event: CommunityEvent) {
  const date = new Date(event.startsAt);
  return {
    month: formatter(event.timezone, { month: "short" })
      .format(date)
      .toUpperCase(),
    day: formatter(event.timezone, { day: "2-digit" }).format(date),
  };
}

export function formatCardDayAndTime(event: CommunityEvent) {
  const date = new Date(event.startsAt);
  const day = formatter(event.timezone, { weekday: "long" }).format(date);
  const start = formatter(event.timezone, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (!event.endsAt) {
    return `${day} · ${start}`;
  }

  const end = formatter(event.timezone, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.endsAt));
  return `${day} · ${start}–${end}`;
}

export function formatEventDate(event: CommunityEvent) {
  return formatter(event.timezone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(event.startsAt));
}

export function formatEventTime(event: CommunityEvent, timezone = event.timezone) {
  const start = formatter(timezone, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.startsAt));

  if (!event.endsAt) {
    return start;
  }

  const end = formatter(timezone, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.endsAt));
  return `${start}–${end}`;
}

export function formatVisitorDateTime(event: CommunityEvent, timezone: string) {
  return formatter(timezone, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(event.startsAt));
}

export function isEventPast(event: CommunityEvent, now: Date) {
  const comparisonDate = new Date(event.endsAt ?? event.startsAt);
  return comparisonDate.getTime() < now.getTime();
}

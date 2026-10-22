"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CommunityEvent } from "@/data/events";
import { isEventPast } from "@/lib/event-date";
import EventCard from "./EventCard";
import EventModal from "./EventModal";

type EventGridProps = {
  events: CommunityEvent[];
  renderedAt: string;
};

export function EventGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-label="Loading events"
      aria-busy="true"
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="aspect-[4/3] min-h-[250px] animate-pulse rounded-[1.35rem] border border-white/10 bg-white/8 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

export default function EventGrid({ events, renderedAt }: EventGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentTime, setCurrentTime] = useState(renderedAt);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const openedFromCardRef = useRef(false);
  const requestedSlug = searchParams.get("event");

  useEffect(() => {
    const refreshTime = () => setCurrentTime(new Date().toISOString());
    const initialRefresh = window.setTimeout(refreshTime, 0);
    const interval = window.setInterval(refreshTime, 60_000);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, []);

  const upcomingEvents = useMemo(() => {
    const now = new Date(currentTime);
    return events
      .filter((event) => !isEventPast(event, now))
      .sort(
        (first, second) =>
          new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
      );
  }, [currentTime, events]);

  const selectedEvent = requestedSlug
    ? events.find((event) => event.slug === requestedSlug) ?? null
    : null;

  function eventUrl(slug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("event", slug);
    else params.delete("event");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function openEvent(event: CommunityEvent, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger;
    openedFromCardRef.current = true;
    router.push(eventUrl(event.slug), { scroll: false });
  }

  function closeEvent() {
    if (openedFromCardRef.current) {
      openedFromCardRef.current = false;
      router.back();
    } else {
      router.replace(eventUrl(), { scroll: false });
    }
  }

  return (
    <>
      {upcomingEvents.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {upcomingEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              priority={index < 3}
              onSelect={openEvent}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold">No upcoming events yet</h2>
          <p className="mt-2 text-white/65">
            Check back soon. A community event suggestion option is coming later.
          </p>
        </div>
      )}

      <EventModal
        event={selectedEvent}
        requestedSlug={requestedSlug}
        returnFocusRef={returnFocusRef}
        onRequestClose={closeEvent}
        onRetry={() => router.refresh()}
      />
    </>
  );
}

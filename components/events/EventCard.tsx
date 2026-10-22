"use client";

import Image from "next/image";
import { useState, type MouseEvent } from "react";
import type { CommunityEvent } from "@/data/events";
import { formatCardDayAndTime, formatDateBadge } from "@/lib/event-date";

type EventCardProps = {
  event: CommunityEvent;
  priority?: boolean;
  onSelect: (event: CommunityEvent, trigger: HTMLButtonElement) => void;
};

const artworkClasses: Record<CommunityEvent["artwork"], string> = {
  photo: "event-art-photo",
  dance: "event-art-dance",
  run: "event-art-run",
  birthday: "event-art-birthday",
};

export default function EventCard({ event, priority = false, onSelect }: EventCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const date = formatDateBadge(event);

  function handleClick(clickEvent: MouseEvent<HTMLButtonElement>) {
    onSelect(event, clickEvent.currentTarget);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`View details for ${event.name}`}
      className={`group relative isolate aspect-[4/3] min-h-[250px] w-full overflow-hidden rounded-[1.35rem] border border-white/15 bg-neutral-900 text-left text-white shadow-[0_18px_45px_rgba(0,0,0,0.24)] transition duration-200 hover:-translate-y-1 hover:border-white/35 hover:shadow-[0_24px_55px_rgba(0,0,0,0.34)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8065] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0a] ${artworkClasses[event.artwork]}`}
    >
      {event.image && !imageFailed ? (
        <Image
          src={event.image.src}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
          className="-z-20 object-cover transition duration-300 group-hover:scale-[1.03]"
          style={{ objectPosition: event.image.position }}
          onError={() => setImageFailed(true)}
          priority={priority}
        />
      ) : null}

      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,7,6,0.08)_8%,rgba(4,7,6,0.25)_43%,rgba(4,7,6,0.94)_100%),linear-gradient(90deg,rgba(4,7,6,0.36),transparent_62%)] transition duration-200 group-hover:brightness-110"
      />

      <span className="absolute left-4 top-4 grid min-w-14 rounded-xl bg-white/95 px-2.5 py-2 text-center text-neutral-950 shadow-lg">
        <span className="text-[0.68rem] font-medium tracking-[0.12em]">
          {date.month}
        </span>
        <span className="text-xl font-semibold leading-none">{date.day}</span>
      </span>

      {event.status ? (
        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold ${event.status === "cancelled" ? "bg-red-600" : "bg-amber-500 text-neutral-950"}`}
        >
          {event.status === "cancelled" ? "Cancelled" : "Postponed"}
        </span>
      ) : null}

      <span className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <span className="line-clamp-2 block text-xl font-semibold leading-tight drop-shadow-sm md:text-2xl">
          {event.name}
        </span>
        <span className="mt-3 grid gap-1.5 text-sm text-white/85">
          <span className="flex items-center gap-2">
            <span aria-hidden="true">◷</span>
            <span>{formatCardDayAndTime(event)}</span>
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true">⌖</span>
            <span className="truncate">{event.venue}</span>
          </span>
        </span>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
          View details
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            ↗
          </span>
        </span>
      </span>
    </button>
  );
}

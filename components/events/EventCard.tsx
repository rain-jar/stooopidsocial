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
      className="board-photo board-pinned group w-full text-left"
    >
      <span className={`relative isolate block aspect-[4/3] overflow-hidden ${artworkClasses[event.artwork]}`}>
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

      </span>
      <span className="block px-2 pb-2 pt-4">
        <span className="block break-words text-xl font-bold leading-tight">
          {event.name}
        </span>
        <span className="mt-3 grid gap-1.5 text-sm text-stone-700">
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

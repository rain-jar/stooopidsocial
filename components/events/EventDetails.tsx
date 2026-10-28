"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CommunityEvent } from "@/data/events";
import {
  formatEventDate,
  formatEventTime,
  formatVisitorDateTime,
  isEventPast,
} from "@/lib/event-date";
import { googleCalendarUrl } from "@/lib/google-calendar";

type EventDetailsProps = {
  event: CommunityEvent;
};

const subscribeToTimezone = () => () => {};

function useVisitorTimezone() {
  return useSyncExternalStore(
    subscribeToTimezone,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    () => null,
  );
}

function safeExternalUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function EventDetails({ event }: EventDetailsProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const imageTriggerRef = useRef<HTMLButtonElement>(null);
  const visitorTimezone = useVisitorTimezone();
  const [shareMessage, setShareMessage] = useState("");
  const past = isEventPast(event, new Date());
  const cancelled = event.status === "cancelled";
  const postponed = event.status === "postponed";
  const rsvpUrl = safeExternalUrl(event.rsvpUrl);
  const calendarUrl = useMemo(() => googleCalendarUrl(event), [event]);

  useEffect(() => {
    const dialog = imageDialogRef.current;
    if (!dialog) return;

    if (imageExpanded && !dialog.open) {
      dialog.showModal();
    } else if (!imageExpanded && dialog.open) {
      dialog.close();
      window.setTimeout(() => imageTriggerRef.current?.focus(), 0);
    }
  }, [imageExpanded]);

  const mapUrl = useMemo(() => {
    if (!event.address) return null;
    const directUrl = safeExternalUrl(event.address);
    if (directUrl) return directUrl;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
  }, [event.address]);

  async function shareEvent() {
    const url = window.location.href;
    const text = `${event.name} — ${formatEventDate(event)} at ${formatEventTime(event)} Eastern Time, ${event.venue}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: event.name, text, url });
        setShareMessage("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("Unable to share. Please copy the page URL.");
    }
  }

  return (
    <div>
      <div
        className={`event-modal-art relative aspect-[16/9] overflow-hidden bg-neutral-800 event-art-${event.artwork}`}
      >
        {event.image && !imageFailed ? (
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            sizes="(max-width: 767px) 100vw, 720px"
            className="object-cover"
            style={{ objectPosition: event.image.position }}
            onError={() => setImageFailed(true)}
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
        {event.image && !imageFailed ? (
          <button
            ref={imageTriggerRef}
            type="button"
            onClick={() => setImageExpanded(true)}
            aria-label={`View full-size image for ${event.name}`}
            className="group absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
          >
            <span className="absolute bottom-4 right-4 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white opacity-90 backdrop-blur transition group-hover:bg-black/80">
              Expand image
            </span>
          </button>
        ) : null}
        {cancelled || postponed || past ? (
          <span
            className={`absolute bottom-4 left-5 z-20 rounded-full px-3 py-1.5 text-sm font-semibold ${cancelled ? "bg-red-600 text-white" : postponed ? "bg-amber-500 text-neutral-950" : "bg-black/75 text-white"}`}
          >
            {cancelled ? "Cancelled" : postponed ? "Postponed" : "Past event"}
          </span>
        ) : null}
      </div>

      {event.image && !imageFailed ? (
        <dialog
          ref={imageDialogRef}
          className="event-image-dialog"
          aria-label={`${event.name} full-size image`}
          onCancel={(cancelEvent) => {
            cancelEvent.preventDefault();
            setImageExpanded(false);
          }}
          onClick={(clickEvent) => {
            if (clickEvent.target === clickEvent.currentTarget) {
              setImageExpanded(false);
            }
          }}
        >
          <div className="relative mx-auto my-4 h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] sm:my-8 sm:h-[calc(100dvh-4rem)] sm:w-[calc(100%-4rem)]">
            <Image
              src={event.image.src}
              alt={event.image.alt}
              fill
              sizes="100vw"
              className="object-contain"
              onError={() => {
                setImageExpanded(false);
                setImageFailed(true);
              }}
              priority
            />
            <button
              type="button"
              onClick={() => setImageExpanded(false)}
              aria-label="Close full-size image"
              className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full border border-white/20 bg-black/70 text-2xl text-white backdrop-blur transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6"
            >
              ×
            </button>
          </div>
        </dialog>
      ) : null}

      <div className="space-y-6 p-5 pb-8 md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ff8065]">
            Community event
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {event.name}
          </h2>
        </div>

        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <dl className="grid gap-4 text-sm">
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="text-white/55">Date</dt>
              <dd className="font-medium text-white">{formatEventDate(event)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="text-white/55">Time</dt>
              <dd className="font-medium text-white">
                {formatEventTime(event)} Eastern Time
                {visitorTimezone && visitorTimezone !== event.timezone ? (
                  <span className="mt-1 block font-normal text-white/55">
                    Your time: {formatVisitorDateTime(event, visitorTimezone)}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="text-white/55">Place</dt>
              <dd className="font-medium text-white">{event.venue}</dd>
            </div>
          </dl>
          {!cancelled && !postponed ? (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 text-center text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8065] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 sm:w-auto sm:whitespace-nowrap"
            >
              + Add to Google Calendar
            </a>
          ) : null}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">About this event</h3>
          <p className="mt-2 leading-7 text-white/72">{event.description}</p>
        </div>

        {!cancelled && !postponed && !past ? (
          rsvpUrl ? (
            <a
              href={rsvpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#ff8065] px-5 font-semibold text-neutral-950 transition hover:bg-[#ff937c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              RSVP here ↗
            </a>
          ) : (
            <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-center font-semibold text-emerald-100">
              Just show up — no RSVP needed
            </div>
          )
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8065]"
            >
              Open in Maps ↗
            </a>
          ) : null}
          <button
            type="button"
            onClick={shareEvent}
            className="min-h-11 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8065]"
          >
            Share event
          </button>
        </div>
        <p aria-live="polite" className="min-h-5 text-center text-sm text-white/60">
          {shareMessage}
        </p>
      </div>
    </div>
  );
}

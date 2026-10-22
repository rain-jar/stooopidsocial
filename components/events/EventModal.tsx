"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type { CommunityEvent } from "@/data/events";
import EventDetails from "./EventDetails";

type EventModalProps = {
  event: CommunityEvent | null;
  requestedSlug: string | null;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onRequestClose: () => void;
  onRetry: () => void;
};

export default function EventModal({
  event,
  requestedSlug,
  returnFocusRef,
  onRequestClose,
  onRetry,
}: EventModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startYRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const open = requestedSlug !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      setDragOffset(0);
      window.setTimeout(() => returnFocusRef.current?.focus(), 0);
    }
  }, [open, returnFocusRef]);

  function handlePointerDown(pointerEvent: ReactPointerEvent<HTMLDivElement>) {
    startYRef.current = pointerEvent.clientY;
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  }

  function handlePointerMove(pointerEvent: ReactPointerEvent<HTMLDivElement>) {
    if (startYRef.current === null) return;
    setDragOffset(Math.max(0, pointerEvent.clientY - startYRef.current));
  }

  function handlePointerEnd() {
    startYRef.current = null;
    if (dragOffset > 96) {
      onRequestClose();
    } else {
      setDragOffset(0);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="event-dialog"
      aria-label={event ? `${event.name} details` : "Event details unavailable"}
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        onRequestClose();
      }}
    >
      <button
        type="button"
        onClick={onRequestClose}
        aria-label="Close event details"
        className="absolute right-3 top-3 z-30 grid size-11 place-items-center rounded-full border border-white/15 bg-black/65 text-xl text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8065] md:right-4 md:top-4"
      >
        ×
      </button>

      <div
        className="event-modal-panel relative bg-[#11120f] text-white"
        style={{ transform: dragOffset ? `translateY(${dragOffset}px)` : undefined }}
      >
        <div
          className="event-modal-drag-handle absolute inset-x-0 top-0 z-20 flex h-9 touch-none items-start justify-center pt-2 md:hidden"
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <span className="h-1.5 w-12 rounded-full bg-white/45" />
        </div>

        {event ? (
          <EventDetails event={event} />
        ) : (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <h2 className="text-2xl font-bold">We couldn’t find this event</h2>
              <p className="mt-2 text-white/65">
                The link may be outdated or the event may have moved.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onRetry}
                  className="min-h-11 rounded-xl bg-[#ff8065] px-5 font-semibold text-neutral-950"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={onRequestClose}
                  className="min-h-11 rounded-xl border border-white/15 px-5 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

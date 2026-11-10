"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { runContent, type RunPhoto } from "@/data/run";

type LoadState = "loading" | "ready" | "error";

type Drag = {
  id: number;
  x: number;
  y: number;
  locked: "x" | "y" | null;
  dx: number;
};

function RunningIndicator() {
  const [frame, setFrame] = useState<0 | 1>(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setFrame((current) => (current === 0 ? 1 : 0));
    }, 160);
    return () => window.clearInterval(id);
  }, [reduced]);

  const image = reduced
    ? runContent.duck.frames.rest
    : frame === 0
      ? runContent.duck.frames.runA
      : runContent.duck.frames.runB;

  return (
    <div role="status" className="flex items-center gap-3 py-2">
      <Image
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        unoptimized
        className={`run-indicator${reduced ? "" : " is-running"}`}
      />
      <span className="text-sm font-bold">{runContent.photos.loadingLabel}</span>
    </div>
  );
}

function FollowLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={runContent.photos.follow.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`run-press ${className}`.trim()}
    >
      {runContent.photos.follow.label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function FallbackCard() {
  return (
    <div className="run-card flex min-h-64 flex-col items-start justify-center gap-4 px-5 py-8">
      <h3 className="text-xl font-bold">{runContent.photos.emptyTitle}</h3>
      <p>{runContent.photos.emptyBody}</p>
      <FollowLink />
    </div>
  );
}

export default function Rolodex() {
  const photos = runContent.photos.items;
  const [index, setIndex] = useState(0);
  const [dragDeg, setDragDeg] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [enterFrom, setEnterFrom] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [status, setStatus] = useState<Record<string, LoadState>>(() =>
    Object.fromEntries(photos.map((photo) => [photo.src, "loading"])),
  );
  const dragRef = useRef<Drag | null>(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;
    let cancelled = false;
    for (const photo of photos) {
      const image = new window.Image();
      image.onload = () => {
        if (!cancelled) setStatus((current) => ({ ...current, [photo.src]: "ready" }));
      };
      image.onerror = () => {
        if (!cancelled) setStatus((current) => ({ ...current, [photo.src]: "error" }));
      };
      image.src = photo.src;
    }
    return () => {
      cancelled = true;
    };
  }, [photos]);

  const loading = photos.some((photo) => status[photo.src] === "loading");
  const readyCount = photos.filter((photo) => status[photo.src] !== "error").length;
  const showFallback = photos.length === 0 || (!loading && readyCount === 0);
  const count = photos.length;

  const goNext = () => {
    if (count < 2 || leaving) return;
    if (reduced) {
      setIndex((current) => (current + 1) % count);
      setDragDeg(0);
      return;
    }
    leavingRef.current = true;
    setDragging(false);
    setLeaving(true);
    setDragDeg(-86);
  };

  const goPrev = () => {
    if (count < 2 || leaving) return;
    if (reduced) {
      setIndex((current) => (current - 1 + count) % count);
      setDragDeg(0);
      return;
    }
    setDragging(false);
    setDragDeg(0);
    setIndex((current) => (current - 1 + count) % count);
    setEnterFrom(true);
  };

  useEffect(() => {
    if (!enterFrom) return;
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setEnterFrom(false));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [enterFrom]);

  const onTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (event.propertyName !== "transform" || !leavingRef.current) return;
    leavingRef.current = false;
    setLeaving(false);
    setDragDeg(0);
    setIndex((current) => (current + 1) % count);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || showFallback) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, locked: null, dx: 0 };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id || leaving) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (drag.locked === "y") {
        dragRef.current = null;
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    if (drag.locked !== "x") return;
    drag.dx = dx;
    setDragDeg(Math.max(-78, Math.min(36, dx * 0.32)));
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.id) return;
    const dx = drag.dx;
    dragRef.current = null;
    setDragging(false);
    if (drag.locked !== "x") {
      setDragDeg(0);
      return;
    }
    if (dx <= -52) goNext();
    else if (dx >= 52) goPrev();
    else setDragDeg(0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      goPrev();
    }
  };

  if (showFallback) return <FallbackCard />;

  const rotate = leaving || enterFrom ? -86 : dragDeg;
  const transition = dragging || enterFrom || reduced ? "none" : "transform 480ms cubic-bezier(.2,.65,.2,1)";
  const caption = photos[index]?.caption;

  return (
    <div className="run-rolodex">
      {loading ? <RunningIndicator /> : null}
      <div
        className="run-rolodex-stage"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={runContent.photos.title}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <p className="sr-only" aria-live="polite">
          Photo {index + 1} of {count}
          {caption ? `. ${caption}` : ""}
        </p>
        <div className="run-rolodex-stack">
          {[2, 1, 0].map((offset) => {
            const cardIndex = (index + offset) % count;
            const photo = photos[cardIndex];
            const front = offset === 0;
            return (
              <PhotoCard
                key={`${photo.src}-${offset}`}
                photo={photo}
                offset={offset}
                front={front}
                failed={status[photo.src] === "error"}
                rotate={front ? rotate : 0}
                transition={front ? transition : undefined}
                onTransitionEnd={front ? onTransitionEnd : undefined}
                positionLabel={`${cardIndex + 1} of ${count}`}
              />
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-bold" aria-hidden="true">
        {index + 1} / {count}
      </p>
      <div className="mt-4 flex gap-3">
        <button type="button" className="run-press flex-1" onClick={goPrev}>
          {runContent.photos.previousLabel}
        </button>
        <button type="button" className="run-press flex-1" onClick={goNext}>
          {runContent.photos.nextLabel}
        </button>
      </div>
      <div className="mt-4">
        <FollowLink />
      </div>
    </div>
  );
}

function PhotoCard({
  photo,
  offset,
  front,
  failed,
  rotate,
  transition,
  onTransitionEnd,
  positionLabel,
}: {
  photo: RunPhoto;
  offset: number;
  front: boolean;
  failed: boolean;
  rotate: number;
  transition?: string;
  onTransitionEnd?: (event: React.TransitionEvent<HTMLElement>) => void;
  positionLabel: string;
}) {
  const stackTransform = front
    ? `rotateX(${rotate}deg)`
    : `translateY(${offset * 12}px) scale(${1 - offset * 0.035})`;

  return (
    <article
      className="run-rolodex-card"
      style={{
        transform: stackTransform,
        transition,
        transformOrigin: front ? "center top" : "center center",
        zIndex: 10 - offset,
      }}
      aria-hidden={front ? undefined : true}
      onTransitionEnd={onTransitionEnd}
    >
      {failed ? (
        <div className="flex h-full flex-col items-start justify-center gap-3 px-4 py-6">
          <p className="font-bold">{runContent.photos.emptyTitle}</p>
          <a
            href={runContent.photos.follow.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline decoration-[3px] underline-offset-4"
          >
            {runContent.photos.follow.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      ) : (
        <figure className="flex h-full flex-col" aria-label={`Photo ${positionLabel}`}>
          <div className="relative min-h-0 flex-1">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 800px) 70vw, 480px"
              className="object-cover"
            />
          </div>
          {photo.caption ? (
            <figcaption className="border-t-[3px] border-[#2c2c2a] px-3 py-2 text-sm font-bold">
              {photo.caption}
            </figcaption>
          ) : null}
        </figure>
      )}
    </article>
  );
}

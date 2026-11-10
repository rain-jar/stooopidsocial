"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { runContent, type DuckPose } from "@/data/run";

type Motion = {
  x: number;
  y: number;
  width: number;
  animate: boolean;
  ms: number;
  pose: DuckPose;
  frame: 0 | 1;
  dropping: boolean;
  running: boolean;
  visible: boolean;
};

const INITIAL: Motion = {
  x: 0,
  y: 0,
  width: 200,
  animate: false,
  ms: 700,
  pose: "start",
  frame: 0,
  dropping: false,
  running: false,
  visible: false,
};

const HOLD_MS = 2000;
const DROP_MS = 700;

/**
 * Travel width matches the CSS content column in app/globals.css:
 * under 800px the duck stays in the 8.35rem lane; wider viewports
 * leave a margin of (viewport - content) / 2.
 */
function travelWidth() {
  const viewport = window.innerWidth;
  if (viewport < 800) return 116;
  const content =
    viewport >= 1100
      ? Math.min(40 * 16, viewport - 24 * 16)
      : Math.min(34 * 16, viewport - 18 * 16);
  const margin = (viewport - content) / 2;
  return Math.max(112, Math.min(220, Math.floor(margin - 20)));
}

export default function RunDuck() {
  const [motion, setMotion] = useState<Motion>(INITIAL);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const content = document.querySelector<HTMLElement>(".run-content");
    const scrollport = document.querySelector<HTMLElement>(".run-scrollport");
    if (!content || !scrollport) return;

    const frames = runContent.duck.frames;
    for (const frame of [frames.start, frames.runA, frames.runB, frames.peek, frames.rest]) {
      const image = new window.Image();
      image.src = frame.src;
    }

    let cancelled = false;
    let timer = 0;
    let frameTimer = 0;
    let introDone = false;
    let currentIndex = -1;
    let animating = false;
    let queued: number | null = null;
    const ratios = new Map<Element, number>();

    const sections = () => Array.from(content.querySelectorAll<HTMLElement>("[data-run-section]"));
    const landingImage = () => content.querySelector<HTMLElement>(".run-duck-static-start");

    const apply = (partial: Partial<Motion>) => {
      if (cancelled) return;
      setMotion((previous) => ({ ...previous, ...partial }));
    };

    const landingBox = () => {
      const image = landingImage();
      if (!image) return { x: 16, y: 180, width: travelWidth() };
      return { x: image.offsetLeft, y: image.offsetTop, width: image.offsetWidth };
    };

    const lanePoint = (index: number) => {
      const section = sections()[index];
      return {
        x: 0,
        y: section ? section.offsetTop + 76 : 0,
        width: travelWidth(),
      };
    };

    const stageLanePoint = () => {
      const image = landingImage();
      const box = landingBox();
      const runHeight = travelWidth() * (frames.runA.height / frames.runA.width);
      const y = image ? image.offsetTop + Math.max(0, (image.offsetHeight - runHeight) / 2) : box.y;
      return { x: 0, y, width: travelWidth() };
    };

    const stopRunning = () => {
      if (frameTimer) window.clearInterval(frameTimer);
      frameTimer = 0;
    };

    const startRunning = () => {
      if (frameTimer) return;
      apply({ running: true, dropping: false, pose: "run" });
      frameTimer = window.setInterval(() => {
        setMotion((previous) => ({ ...previous, frame: previous.frame === 0 ? 1 : 0 }));
      }, 160);
    };

    const moveTo = (point: { x: number; y: number; width: number }, ms: number) =>
      new Promise<void>((resolve) => {
        apply({
          ...point,
          animate: true,
          ms,
          running: true,
          dropping: false,
          pose: "run",
          visible: true,
        });
        timer = window.setTimeout(resolve, ms + 50);
      });

    const settleLayout = () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      });

    const finishAt = (index: number) => {
      stopRunning();
      const pose: DuckPose = index <= 0 ? "rest" : "peek";
      const point = index <= 0 ? landingBox() : lanePoint(index);
      let x = point.x;
      let width = point.width;
      if (index <= 0) {
        const startRatio = frames.start.height / frames.start.width;
        const restRatio = frames.rest.height / frames.rest.width;
        width = Math.min(point.width, (point.width * startRatio) / restRatio);
        x = point.x + (point.width - width) / 2;
      }
      apply({
        x,
        y: point.y,
        width,
        animate: false,
        running: false,
        dropping: false,
        pose,
        visible: true,
      });
      currentIndex = index;
      animating = false;
      if (queued !== null && queued !== currentIndex) {
        const next = queued;
        queued = null;
        void runTo(next);
      }
    };

    const runTo = async (index: number) => {
      if (cancelled) return;
      if (animating) {
        if (index !== currentIndex) queued = index;
        return;
      }
      if (index === currentIndex) return;

      const from = currentIndex;
      currentIndex = index;
      animating = true;
      startRunning();

      if (from < 0 && index > 0) {
        await moveTo(stageLanePoint(), 480);
        if (cancelled) return;
        content.classList.add("run-departed");
        await settleLayout();
        if (cancelled) return;
        await moveTo(lanePoint(index), 820);
      } else if (from > 0 && index <= 0) {
        content.classList.remove("run-departed");
        await settleLayout();
        if (cancelled) return;
        await moveTo(stageLanePoint(), 820);
        if (cancelled) return;
        await moveTo(landingBox(), 480);
      } else if (index <= 0) {
        await moveTo(landingBox(), 520);
      } else {
        const fromPoint = from > 0 ? lanePoint(from) : stageLanePoint();
        const toPoint = lanePoint(index);
        const distance = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
        const ms = Math.max(480, Math.min(1100, distance * 0.85));
        await moveTo(toPoint, ms);
      }

      if (cancelled) return;
      finishAt(index);
    };

    const visibleSection = () => {
      let best = 0;
      let bestRatio = 0;
      ratios.forEach((ratio, element) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = Number((element as HTMLElement).dataset.runSection ?? 0);
        }
      });
      return { best, bestRatio };
    };

    const showLanding = () => {
      const box = landingBox();
      content.classList.add("run-motion");
      apply({
        visible: true,
        x: box.x,
        y: box.y,
        width: box.width,
        animate: false,
        dropping: true,
        running: false,
        pose: "start",
        frame: 0,
      });
    };

    const onReduce = () => {
      if (!media.matches) return;
      cancelled = true;
      window.clearTimeout(timer);
      stopRunning();
      content.classList.remove("run-motion");
      content.classList.remove("run-departed");
      apply({ visible: false, running: false, dropping: false });
    };

    media.addEventListener("change", onReduce);

    const frameId = window.requestAnimationFrame(() => {
      showLanding();
      timer = window.setTimeout(() => {
        apply({ dropping: false });
        timer = window.setTimeout(() => {
          introDone = true;
          const { best, bestRatio } = visibleSection();
          const destination = best >= 1 && bestRatio > 0.5 ? best : 1;
          void runTo(destination);
        }, HOLD_MS);
      }, DROP_MS);
    });

    let scrolled = false;
    const onScroll = () => {
      if (scrollport.scrollTop > 48) scrolled = true;
    };
    scrollport.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
        if (!introDone || !scrolled) return;
        const { best, bestRatio } = visibleSection();
        if (best >= 1 && bestRatio >= 0.46) void runTo(best);
        else if (best === 0 && bestRatio >= 0.6 && scrollport.scrollTop < 24) {
          scrolled = false;
          void runTo(0);
        }
      },
      { root: scrollport, threshold: [0.25, 0.4, 0.55, 0.7, 0.85] },
    );
    sections().forEach((section) => observer.observe(section));

    const onResize = () => {
      if (animating) return;
      if (!introDone || currentIndex <= 0) {
        const box = landingBox();
        apply({ x: box.x, y: box.y, width: box.width, animate: false });
        return;
      }
      apply({ ...lanePoint(currentIndex), animate: false });
    };

    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(content);
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timer);
      stopRunning();
      observer.disconnect();
      resizeObserver.disconnect();
      scrollport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      media.removeEventListener("change", onReduce);
      content.classList.remove("run-motion");
      content.classList.remove("run-departed");
    };
  }, []);

  if (!motion.visible) return null;

  const frames = runContent.duck.frames;
  const frame =
    motion.pose === "start"
      ? frames.start
      : motion.pose === "peek"
        ? frames.peek
        : motion.pose === "rest"
          ? frames.rest
          : motion.frame === 0
            ? frames.runA
            : frames.runB;

  return (
    <div
      className={`run-duck-mover${motion.dropping ? " is-dropping" : ""}${motion.running ? " is-running" : ""}`}
      style={{
        transform: `translate3d(${motion.x}px, ${motion.y}px, 0)`,
        transition: motion.animate ? `transform ${motion.ms}ms linear, width ${motion.ms}ms linear` : "none",
        width: motion.width,
      }}
      role="img"
      aria-label={runContent.duck.alt[motion.pose]}
    >
      <div className="run-duck-sprite">
        <Image src={frame.src} alt="" width={frame.width} height={frame.height} unoptimized />
      </div>
    </div>
  );
}

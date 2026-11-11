"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { runContent, type DuckPose } from "@/data/run";

type Clip = "none" | "corner" | "rolodex";

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
  phone: boolean;
  clip: Clip;
  boxH: number | null;
};

type Point = {
  x: number;
  y: number;
  width: number;
  clip?: Clip;
  boxH?: number;
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
  phone: false,
  clip: "none",
  boxH: null,
};

const HOLD_MS = 2000;
const DROP_MS = 700;
const PHONE_MAX = 767;
const CORNER_H = 96;

/**
 * Travel width matches the desktop content column in app/globals.css.
 * Phone layout does not use this lane.
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

function isPhone() {
  return window.innerWidth <= PHONE_MAX;
}

export default function RunDuck() {
  const [motion, setMotion] = useState<Motion>(INITIAL);
  const [hopping, setHopping] = useState(false);
  const hopTimer = useRef(0);
  const runningRef = useRef(false);

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
      if (partial.running !== undefined) runningRef.current = partial.running;
      setMotion((previous) => ({ ...previous, ...partial }));
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, ms);
      });

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
      apply({ running: true, dropping: false, pose: "run", clip: "none" });
      frameTimer = window.setInterval(() => {
        setMotion((previous) => ({ ...previous, frame: previous.frame === 0 ? 1 : 0 }));
      }, 160);
    };

    const moveTo = (point: Point, ms: number) =>
      new Promise<void>((resolve) => {
        apply({
          x: point.x,
          y: point.y,
          width: point.width,
          clip: point.clip ?? "none",
          animate: true,
          ms,
          running: true,
          dropping: false,
          pose: "run",
          visible: true,
          phone: isPhone(),
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
        phone: false,
        clip: "none",
      });
      currentIndex = index;
      animating = false;
      if (queued !== null && queued !== currentIndex) {
        const next = queued;
        queued = null;
        void runTo(next);
      }
    };

    const viewTop = () => 76;
    const viewBottom = () => window.innerHeight - 12;

    const rolodexPoint = (): Point | null => {
      const stack = content.querySelector<HTMLElement>(".run-rolodex-stack");
      if (!stack) return null;
      const rect = stack.getBoundingClientRect();
      if (rect.bottom < viewTop() + 36 || rect.top > viewBottom()) return null;
      const height = 77;
      const y = Math.min(Math.max(rect.top - height * 0.62, viewTop()), rect.bottom - height);
      return {
        x: Math.max(10, rect.left + 6),
        y: y + scrollport.scrollTop,
        width: 104,
        clip: "rolodex",
      };
    };

    const freeBands = (section: HTMLElement) => {
      const sectionRect = section.getBoundingClientRect();
      const top = Math.max(viewTop(), sectionRect.top);
      const bottom = Math.min(viewBottom(), sectionRect.bottom);
      if (bottom - top < 48) return [];
      const blocks = Array.from(section.querySelectorAll<HTMLElement>("h1, h2, p, li, a, button, summary, .run-card, .run-rolodex"))
        .filter((element) => !element.classList.contains("run-duck-mover"))
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width > 8 && rect.height > 8 && rect.bottom > top && rect.top < bottom)
        .map((rect) => ({ top: Math.max(rect.top, top), bottom: Math.min(rect.bottom, bottom) }))
        .sort((a, b) => a.top - b.top);
      const merged: { top: number; bottom: number }[] = [];
      for (const block of blocks) {
        const last = merged[merged.length - 1];
        if (!last || block.top > last.bottom + 1) merged.push({ ...block });
        else last.bottom = Math.max(last.bottom, block.bottom);
      }
      const gaps: { top: number; height: number }[] = [];
      let cursor = top;
      for (const block of merged) {
        if (block.top - cursor >= 48) gaps.push({ top: cursor, height: block.top - cursor });
        cursor = Math.max(cursor, block.bottom);
      }
      if (bottom - cursor >= 48) gaps.push({ top: cursor, height: bottom - cursor });
      return gaps.filter((gap) => gap.height >= 48);
    };

    const cornerPoint = (index: number): Point | null => {
      if (index === 4) {
        const overCard = rolodexPoint();
        if (overCard) return overCard;
      }
      const section = sections()[index];
      const gaps = section ? freeBands(section) : [];
      if (gaps.length === 0) return null;
      const mid = window.innerHeight * 0.46;
      gaps.sort((a, b) => Math.abs(a.top + a.height / 2 - mid) - Math.abs(b.top + b.height / 2 - mid));
      const roomy = gaps[0];
      const boxH = Math.min(CORNER_H, Math.max(64, roomy.height - 10));
      const y = roomy.top + (roomy.height - boxH) / 2;
      return { x: 0, y: y + scrollport.scrollTop, width: 78, clip: "corner", boxH };
    };

    const applyPeek = (index: number, animate: boolean, ms = 280) => {
      const section = sections()[index];
      const point = cornerPoint(index) ?? {
        x: -220,
        y: scrollport.scrollTop + viewTop(),
        width: 78,
        clip: "corner" as const,
        boxH: 64,
      };
      if (!section) return;
      apply({
        x: point.x,
        y: point.y,
        width: point.width,
        boxH: point.boxH ?? null,
        clip: point.clip ?? "corner",
        animate,
        ms,
        running: false,
        dropping: false,
        pose: "peek",
        visible: true,
        phone: true,
      });
    };

    const sprintPhone = async (index: number) => {
      const section = sections()[index];
      const heading = section?.querySelector<HTMLElement>("h1, h2");
      if (!heading) {
        applyPeek(index, false);
        return;
      }
      const rect = heading.getBoundingClientRect();
      const runW = 84;
      const runH = runW * (frames.runA.height / frames.runA.width);
      const y = scrollport.scrollTop + rect.bottom - runH + 4;
      apply({
        x: -runW - 8,
        y,
        width: runW,
        clip: "none",
        animate: false,
        running: true,
        dropping: false,
        pose: "run",
        visible: true,
        phone: true,
        ms: 0,
      });
      await wait(40);
      if (cancelled) return;
      const endX = Math.max(12, Math.min(rect.right - runW - 4, rect.left + rect.width * 0.62));
      await moveTo({ x: endX, y, width: runW, clip: "none" }, 520);
      if (cancelled) return;
      stopRunning();
      applyPeek(index, true, 260);
      await wait(300);
    };

    const runToDesktop = async (from: number, index: number) => {
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

    const runToPhone = async (from: number, index: number) => {
      if (from < 0 && index > 0) {
        const box = landingBox();
        const runW = Math.min(box.width, 150);
        startRunning();
        apply({
          x: box.x,
          y: box.y,
          width: runW,
          clip: "none",
          animate: false,
          running: true,
          pose: "run",
          dropping: false,
          visible: true,
          phone: true,
        });
        await settleLayout();
        if (cancelled) return;
        await moveTo({ x: scrollport.clientWidth + 24, y: box.y, width: runW, clip: "none" }, 620);
        if (cancelled) return;
        content.classList.remove("run-holding");
        content.classList.add("run-departed");
        await wait(700);
        if (cancelled) return;
        await sprintPhone(index);
      } else {
        content.classList.remove("run-holding");
        startRunning();
        await sprintPhone(index);
      }
      if (cancelled) return;
      stopRunning();
      currentIndex = index;
      animating = false;
      applyPeek(index, false);
    };

    const runTo = async (index: number) => {
      if (cancelled) return;
      if (animating) {
        if (!isPhone() && index !== currentIndex) queued = index;
        return;
      }
      if (index === currentIndex) return;

      const from = currentIndex;
      currentIndex = index;
      animating = true;
      if (isPhone()) {
        const watchdog = window.setTimeout(() => {
          if (!cancelled && animating && currentIndex === index) {
            animating = false;
            stopRunning();
            applyPeek(index, false);
          }
        }, 1800);
        await runToPhone(from, index);
        window.clearTimeout(watchdog);
        return;
      }
      startRunning();
      await runToDesktop(from, index);
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
        phone: isPhone(),
        clip: "none",
      });
    };

    const onReduce = () => {
      if (!media.matches) return;
      cancelled = true;
      window.clearTimeout(timer);
      stopRunning();
      content.classList.remove("run-motion");
      content.classList.remove("run-departed");
      content.classList.remove("run-holding");
      apply({ visible: false, running: false, dropping: false });
    };

    media.addEventListener("change", onReduce);

    let trackId = 0;
    let lastLanding = "";
    const trackLanding = () => {
      if (cancelled || introDone || animating) return;
      const box = landingBox();
      const key = `${box.x},${box.y},${box.width}`;
      if (key !== lastLanding) {
        lastLanding = key;
        apply({ x: box.x, y: box.y, width: box.width, animate: false });
      }
      trackId = window.requestAnimationFrame(trackLanding);
    };

    const frameId = window.requestAnimationFrame(() => {
      showLanding();
      trackLanding();
      timer = window.setTimeout(() => {
        apply({ dropping: false });
        if (isPhone()) content.classList.add("run-holding");
        timer = window.setTimeout(() => {
          introDone = true;
          if (isPhone()) {
            void runTo(1);
            return;
          }
          const { best, bestRatio } = visibleSection();
          const destination = best >= 1 && bestRatio > 0.5 ? best : 1;
          void runTo(destination);
        }, HOLD_MS);
      }, DROP_MS);
    });

    let scrolled = false;
    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollport.scrollTop > 48) scrolled = true;
      if (!isPhone() || animating || !introDone || currentIndex < 0) return;
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        if (cancelled || animating || !isPhone()) return;
        if (cornerPoint(currentIndex)) {
          applyPeek(currentIndex, false);
          return;
        }
        const midY = scrollport.clientHeight * 0.45;
        const visible = sections().find((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= midY && rect.bottom >= midY;
        });
        const index = Number(visible?.dataset.runSection ?? -1);
        if (index >= 0 && index !== currentIndex) void runTo(index);
      });
    };
    scrollport.addEventListener("scroll", onScroll, { passive: true });

    const desktopObserver = new IntersectionObserver(
      (entries) => {
        if (isPhone()) return;
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
    sections().forEach((section) => desktopObserver.observe(section));

    const phoneObserver = new IntersectionObserver(
      (entries) => {
        if (!isPhone() || !introDone || animating) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = (entry.target as HTMLElement).closest<HTMLElement>("[data-run-section]");
          if (!section) continue;
          const index = Number(section.dataset.runSection ?? -1);
          if (index < 0 || index === currentIndex) continue;
          if (index === 0 && scrollport.scrollTop > 80) continue;
          void runTo(index);
          return;
        }
      },
      { root: scrollport, rootMargin: "0px 0px -64% 0px", threshold: 0.15 },
    );
    content.querySelectorAll<HTMLElement>("[data-run-section] h1, [data-run-section] h2").forEach((heading) => {
      phoneObserver.observe(heading);
    });

    const onResize = () => {
      if (animating) return;
      if (isPhone()) {
        if (!introDone || currentIndex < 0) {
          const box = landingBox();
          apply({ x: box.x, y: box.y, width: box.width, animate: false, phone: true, clip: "none" });
          return;
        }
        applyPeek(currentIndex, false);
        return;
      }
      if (!introDone || currentIndex <= 0) {
        const box = landingBox();
        apply({ x: box.x, y: box.y, width: box.width, animate: false, phone: false, clip: "none" });
        return;
      }
      apply({ ...lanePoint(currentIndex), animate: false, phone: false, clip: "none" });
    };

    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(content);
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(trackId);
      window.cancelAnimationFrame(scrollRaf);
      window.clearTimeout(timer);
      stopRunning();
      desktopObserver.disconnect();
      phoneObserver.disconnect();
      resizeObserver.disconnect();
      scrollport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      media.removeEventListener("change", onReduce);
      content.classList.remove("run-motion");
      content.classList.remove("run-departed");
      content.classList.remove("run-holding");
    };
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(hopTimer.current);
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

  const className = `run-duck-mover${motion.dropping ? " is-dropping" : ""}${motion.running ? " is-running" : ""}${hopping ? " is-hopping" : ""}`;
  const style = {
    transform: `translate3d(${motion.x}px, ${motion.y}px, 0)`,
    transition: motion.animate ? `transform ${motion.ms}ms linear, width ${motion.ms}ms linear` : "none",
    width: motion.clip === "none" ? motion.width : undefined,
    height: motion.clip === "corner" && motion.boxH ? motion.boxH : undefined,
  };

  const sprite = (
    <div className="run-duck-sprite">
      <Image src={frame.src} alt="" width={frame.width} height={frame.height} unoptimized />
    </div>
  );

  const node = motion.phone ? (
    <button
      type="button"
      className={className}
      style={style}
      data-clip={motion.clip}
      aria-label={runContent.duck.hopLabel}
      onClick={() => {
        if (runningRef.current) return;
        setHopping(true);
        window.clearTimeout(hopTimer.current);
        hopTimer.current = window.setTimeout(() => setHopping(false), 430);
      }}
    >
      {sprite}
    </button>
  ) : (
    <div className={className} style={style} data-clip="none" role="img" aria-label={runContent.duck.alt[motion.pose]}>
      {sprite}
    </div>
  );

  return node;
}

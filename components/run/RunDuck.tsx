"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { runContent, type DuckPose } from "@/data/run";

type Clip = "none" | "corner";

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
/** Scroll positions at or below this count as the top of the page. */
const AT_TOP = 80;
/** Share of peek-mobile.webp that stays on screen. The beak base starts near 48%. */
const PEEK_VISIBLE = 0.53;
const BEAK_TIP = 0.974;
/** Time constant for the post-intro glide, in seconds. */
const GLIDE_TAU = 0.2;
const ARRIVE_MS = 480;
const ARRIVE_PX = 2;

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
  const [arriving, setArriving] = useState(false);
  const hopTimer = useRef(0);
  const arriveTimer = useRef(0);
  const runningRef = useRef(false);
  const hoppingRef = useRef(false);
  const moverRef = useRef<HTMLElement | null>(null);
  const posRef = useRef({ x: 0, y: 0, width: 200 });

  useEffect(() => {
    hoppingRef.current = hopping;
  }, [hopping]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const content = document.querySelector<HTMLElement>(".run-content");
    const scrollport = document.querySelector<HTMLElement>(".run-scrollport");
    if (!content || !scrollport) return;

    const hasDeparted = () => content.classList.contains("run-departed");
    const atTop = () => scrollport.scrollTop <= AT_TOP;

    const frames = runContent.duck.frames;
    for (const frame of [frames.start, frames.runA, frames.runB, frames.peek, frames.peekMobile, frames.rest]) {
      const image = new window.Image();
      image.src = frame.src;
    }

    let cancelled = false;
    let timer = 0;
    let frameTimer = 0;
    let introDone = false;
    let currentIndex = -1;
    let animating = false;
    let gliding = false;
    let glideId = 0;
    let lastGlideT = 0;
    let settledIndex = -1;
    let scrolled = false;
    // After the intro, stay on Sunday until the visitor leaves the top.
    // Once they have, returning to the top peeks at the hero title.
    let leftTop = false;

    const sections = () => Array.from(content.querySelectorAll<HTMLElement>("[data-run-section]"));
    const landingImage = () => content.querySelector<HTMLElement>(".run-duck-static-start");

    const writeMover = () => {
      const el = moverRef.current;
      if (!el) return;
      const { x, y, width } = posRef.current;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.style.width = `${width}px`;
    };

    const apply = (partial: Partial<Motion>) => {
      if (cancelled) return;
      if (partial.running !== undefined) runningRef.current = partial.running;
      if (partial.x !== undefined) posRef.current.x = partial.x;
      if (partial.y !== undefined) posRef.current.y = partial.y;
      if (partial.width !== undefined) posRef.current.width = partial.width;
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

    const viewTop = () => 76;
    const viewBottom = () => window.innerHeight - 12;

    const markLeftTop = () => {
      if (scrollport.scrollTop > AT_TOP) leftTop = true;
    };

    const targetIndex = () => {
      markLeftTop();
      if (atTop()) return leftTop ? 0 : Math.max(0, currentIndex);
      return Math.max(0, activeIndex());
    };

    const activeIndex = () => {
      if (atTop()) return 0;
      const midY = scrollport.clientHeight * 0.45;
      const visible = sections().find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= midY && rect.bottom >= midY;
      });
      return Number(visible?.dataset.runSection ?? Math.max(0, currentIndex));
    };

    const clampY = (y: number, height: number) => {
      const minY = scrollport.scrollTop + viewTop();
      const maxY = scrollport.scrollTop + viewBottom() - height;
      if (maxY < minY) return minY;
      return Math.max(minY, Math.min(y, maxY));
    };

    const followHeading = (index: number, width: number, height: number): number => {
      const section = sections()[index];
      const heading = section?.querySelector<HTMLElement>("h1, h2");
      const scrollY = scrollport.scrollTop;
      if (!section || !heading) return clampY(scrollY + viewTop(), height);
      const head = heading.getBoundingClientRect();
      const sec = section.getBoundingClientRect();
      const viewT = viewTop();
      const viewB = viewBottom();
      let top = head.top;
      if (head.bottom <= viewT) top = viewT;
      else if (head.top >= viewB) top = viewB - height;
      const minTop = Math.max(viewT, sec.top);
      const maxTop = Math.min(viewB, sec.bottom) - height;
      top = maxTop < minTop ? minTop : Math.max(minTop, Math.min(top, maxTop));
      return clampY(top + scrollY, height);
    };

    const cornerPoint = (index: number): Point => {
      const section = sections()[index];
      const frame = runContent.duck.frames.peekMobile;
      const copy = section?.querySelector<HTMLElement>(".run-copy, .run-hero-copy");
      const heading = section?.querySelector<HTMLElement>("h1, h2");
      if (!section || !copy || !heading) {
        const width = 78;
        const height = width * (frame.height / frame.width);
        return {
          x: -220,
          y: clampY(scrollport.scrollTop + viewTop(), height),
          width,
          clip: "corner",
          boxH: Math.round(height),
        };
      }
      const copyLeft = copy.getBoundingClientRect().left;
      const tipX = Math.max(14, copyLeft - 6);
      const width = tipX / (BEAK_TIP - (1 - PEEK_VISIBLE));
      const x = Math.round(-(1 - PEEK_VISIBLE) * width);
      const height = width * (frame.height / frame.width);
      return {
        x,
        y: followHeading(index, width, height),
        width: Math.round(width),
        clip: "corner",
        boxH: Math.round(height),
      };
    };

    const desktopPeekPoint = (index: number): Point => {
      const width = travelWidth();
      const height = width * (frames.peek.height / frames.peek.width);
      return {
        x: 0,
        y: followHeading(index, width, height),
        width,
        clip: "none",
        boxH: Math.round(height),
      };
    };

    const peekTarget = (index: number): Point => (isPhone() ? cornerPoint(index) : desktopPeekPoint(index));

    const triggerBob = () => {
      if (cancelled || hoppingRef.current || media.matches) return;
      window.clearTimeout(arriveTimer.current);
      setArriving(false);
      arriveTimer.current = window.setTimeout(() => {
        if (cancelled || hoppingRef.current) return;
        setArriving(true);
        arriveTimer.current = window.setTimeout(() => {
          if (!cancelled) setArriving(false);
        }, ARRIVE_MS);
      }, 20);
    };

    const stopGlide = () => {
      gliding = false;
      if (glideId) window.cancelAnimationFrame(glideId);
      glideId = 0;
    };

    const glideFrame = (now: number) => {
      if (cancelled || !gliding) return;
      const dt = Math.min(0.05, Math.max(0, (now - lastGlideT) / 1000));
      lastGlideT = now;
      const index = targetIndex();
      currentIndex = index;
      const target = peekTarget(index);
      const height = target.boxH ?? target.width * 0.8;
      const k = 1 - Math.exp(-dt / GLIDE_TAU);
      const pos = posRef.current;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      pos.width += (target.width - pos.width) * k;
      const dist = Math.hypot(target.x - pos.x, target.y - pos.y);
      if (dist < 0.5) {
        pos.x = target.x;
        pos.y = target.y;
        pos.width = target.width;
      }
      pos.y = clampY(pos.y, height);
      writeMover();
      if (dist < ARRIVE_PX && index !== settledIndex) {
        settledIndex = index;
        triggerBob();
      }
      glideId = window.requestAnimationFrame(glideFrame);
    };

    const startGlideLoop = () => {
      if (cancelled || media.matches) return;
      gliding = true;
      if (!glideId) {
        lastGlideT = performance.now();
        glideId = window.requestAnimationFrame(glideFrame);
      }
    };

    const snapToPeek = (index: number) => {
      if (cancelled) return;
      const phone = isPhone();
      markLeftTop();
      const dest = atTop() && leftTop ? 0 : Math.max(0, index);
      currentIndex = dest;
      const target = peekTarget(dest);
      posRef.current.x = target.x;
      posRef.current.y = target.y;
      posRef.current.width = target.width;
      apply({
        x: target.x,
        y: target.y,
        width: target.width,
        boxH: target.boxH ?? null,
        animate: false,
        running: false,
        dropping: false,
        pose: "peek",
        visible: true,
        phone,
        clip: phone ? "corner" : "none",
      });
      writeMover();
    };

    const enterGlide = (index: number, opts?: { fromOffset?: number; snap?: boolean }) => {
      if (cancelled) return;
      introDone = true;
      animating = false;
      stopRunning();
      window.cancelAnimationFrame(trackId);
      const phone = isPhone();
      markLeftTop();
      const dest = atTop() && leftTop ? 0 : Math.max(0, index);
      currentIndex = dest;
      const target = peekTarget(dest);
      if (opts?.snap) {
        posRef.current.x = target.x;
        posRef.current.y = target.y;
        posRef.current.width = target.width;
      } else if (opts?.fromOffset != null) {
        posRef.current.x = target.x;
        posRef.current.y = target.y + opts.fromOffset;
        posRef.current.width = target.width;
      }
      apply({
        x: posRef.current.x,
        y: posRef.current.y,
        width: posRef.current.width,
        boxH: target.boxH ?? null,
        animate: false,
        running: false,
        dropping: false,
        pose: "peek",
        visible: true,
        phone,
        clip: phone ? "corner" : "none",
      });
      settledIndex = -1;
      if (media.matches) {
        stopGlide();
        writeMover();
        return;
      }
      startGlideLoop();
    };

    const playIntro = async (index: number) => {
      if (cancelled || gliding || animating) return;
      animating = true;
      if (isPhone()) {
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
        stopRunning();
        animating = false;
        enterGlide(index, { fromOffset: -28 });
        return;
      }
      startRunning();
      await moveTo(stageLanePoint(), 480);
      if (cancelled) return;
      content.classList.add("run-departed");
      await settleLayout();
      if (cancelled) return;
      stopRunning();
      animating = false;
      enterGlide(index);
    };

    const scrollDestination = () => {
      if (atTop()) return 0;
      const index = activeIndex();
      return index >= 0 ? index : 1;
    };

    const departEarly = () => {
      if (cancelled || introDone || animating) return;
      introDone = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(trackId);
      apply({ dropping: false });
      stopRunning();
      content.classList.remove("run-holding");
      content.classList.add("run-departed");
      void settleLayout().then(() => {
        if (cancelled) return;
        enterGlide(scrollDestination(), { fromOffset: -16 });
      });
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

    const placeStaticPeek = async () => {
      content.classList.add("run-departed", "run-static-peek");
      content.classList.remove("run-holding");
      await settleLayout();
      if (cancelled) return;
      markLeftTop();
      const index = atTop() ? 0 : Math.max(0, activeIndex());
      enterGlide(index, { snap: true });
    };

    const onReduce = () => {
      if (!media.matches) return;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(trackId);
      stopRunning();
      stopGlide();
      window.clearTimeout(arriveTimer.current);
      setArriving(false);
      setHopping(false);
      content.classList.remove("run-motion");
      content.classList.remove("run-holding");
      void placeStaticPeek();
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

    const startMidPage = () => {
      if (cancelled || introDone) return;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(trackId);
      apply({ dropping: false });
      stopRunning();
      content.classList.add("run-motion");
      content.classList.add("run-departed");
      content.classList.remove("run-holding");
      scrolled = true;
      leftTop = true;
      introDone = true;
      void settleLayout().then(() => {
        if (cancelled) return;
        enterGlide(Math.max(0, activeIndex()), { snap: true });
      });
    };

    const boot = () => {
      if (cancelled || introDone) return;
      if (media.matches) {
        void placeStaticPeek();
        return;
      }
      if (scrollport.scrollTop > AT_TOP) {
        startMidPage();
        return;
      }
      showLanding();
      trackLanding();
      timer = window.setTimeout(() => {
        if (cancelled || introDone) return;
        if (scrollport.scrollTop > AT_TOP) {
          startMidPage();
          return;
        }
        apply({ dropping: false });
        if (isPhone()) content.classList.add("run-holding");
        timer = window.setTimeout(() => {
          if (cancelled || introDone) return;
          if (scrollport.scrollTop > AT_TOP) {
            startMidPage();
            return;
          }
          introDone = true;
          void playIntro(1);
        }, HOLD_MS);
      }, DROP_MS);
    };

    trackId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(boot);
    });

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollport.scrollTop > 48) scrolled = true;
      if (!introDone && scrolled && !media.matches) {
        if (scrollport.scrollTop > AT_TOP) {
          startMidPage();
        } else {
          departEarly();
        }
        return;
      }
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        if (cancelled) return;
        if (media.matches && hasDeparted()) {
          snapToPeek(targetIndex());
          return;
        }
        if (!introDone || !gliding) return;
        markLeftTop();
        if (hasDeparted() && atTop() && leftTop) currentIndex = 0;
      });
    };
    scrollport.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      if (cancelled) return;
      if (!introDone || !hasDeparted()) {
        if (animating) return;
        const box = landingBox();
        apply({ x: box.x, y: box.y, width: box.width, animate: false, phone: isPhone(), clip: "none" });
        return;
      }
      const phone = isPhone();
      const index = targetIndex();
      const target = peekTarget(index);
      posRef.current.x = target.x;
      posRef.current.y = target.y;
      posRef.current.width = target.width;
      apply({
        x: target.x,
        y: target.y,
        width: target.width,
        boxH: target.boxH ?? null,
        animate: false,
        pose: "peek",
        phone,
        clip: phone ? "corner" : "none",
      });
      writeMover();
    };

    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(content);
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(trackId);
      window.cancelAnimationFrame(scrollRaf);
      window.clearTimeout(timer);
      window.clearTimeout(arriveTimer.current);
      stopRunning();
      stopGlide();
      resizeObserver.disconnect();
      scrollport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      media.removeEventListener("change", onReduce);
      content.classList.remove("run-motion");
      content.classList.remove("run-departed");
      content.classList.remove("run-holding");
      content.classList.remove("run-static-peek");
    };
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(hopTimer.current);
  }, []);

  useLayoutEffect(() => {
    if (motion.animate || motion.running || motion.dropping || motion.pose !== "peek") return;
    const el = moverRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
    el.style.width = `${posRef.current.width}px`;
  }, [motion, hopping, arriving]);

  if (!motion.visible) return null;

  const frames = runContent.duck.frames;
  const frame =
    motion.pose === "start"
      ? frames.start
      : motion.pose === "peek" && motion.phone
        ? frames.peekMobile
        : motion.pose === "peek"
          ? frames.peek
          : motion.pose === "rest"
            ? frames.rest
            : motion.frame === 0
              ? frames.runA
              : frames.runB;

  const className = `run-duck-mover${motion.dropping ? " is-dropping" : ""}${motion.running ? " is-running" : ""}${hopping ? " is-hopping" : ""}${arriving ? " is-arriving" : ""}`;
  const style = {
    transform: `translate3d(${motion.x}px, ${motion.y}px, 0)`,
    transition: motion.animate ? `transform ${motion.ms}ms linear, width ${motion.ms}ms linear` : "none",
    width: motion.width,
  };

  const sprite = (
    <div className="run-duck-sprite">
      <Image src={frame.src} alt="" width={frame.width} height={frame.height} unoptimized />
    </div>
  );

  const onHop = () => {
    if (runningRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setHopping(true);
    window.clearTimeout(hopTimer.current);
    hopTimer.current = window.setTimeout(() => setHopping(false), 430);
  };

  const node = motion.phone ? (
    <button
      type="button"
      ref={(el) => {
        moverRef.current = el;
      }}
      className={className}
      style={style}
      data-clip={motion.clip}
      aria-label={runContent.duck.hopLabel}
      onClick={onHop}
    >
      {sprite}
    </button>
  ) : (
    <div
      ref={(el) => {
        moverRef.current = el;
      }}
      className={className}
      style={style}
      data-clip="none"
      role="img"
      aria-label={runContent.duck.alt[motion.pose]}
    >
      {sprite}
    </div>
  );

  return node;
}

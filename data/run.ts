/**
 * Run crew page content.
 * Admins can edit copy here. Text marked [Placeholder] is stand-in copy.
 * Photos live in public/run/photos. Duck frames live in public/run/duck.
 * run-a and run-b must stay the same pixel size so the run cycle lines up.
 */

export type RunLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type DuckFrame = {
  src: string;
  width: number;
  height: number;
};

export type DuckPose = "start" | "run" | "peek" | "rest";

export type RunPhoto = {
  src: string;
  alt: string;
  caption?: string;
};

export const runContent = {
  meta: {
    title: "Run | Stooopid Run Crew",
    description:
      "Stooopid Sunday: every Sunday at 10 AM. Meet at the Café Tranquille entrance, 1442 Rue Clark.",
  },
  header: {
    homeLabel: "Stooopid Run Crew",
    homeHref: "/",
    links: [
      { href: "/run", label: "Run" },
      { href: "/links", label: "Linktree" },
    ] satisfies RunLink[],
  },
  footer: {
    motto: "Be good. Be kind. Be stooopid.",
    copyrightName: "Les Stooopids",
  },
  hero: {
    title: "Stooopid Run Crew",
    lede: "Every Sunday at 10 AM at Café Tranquille.",
    note: "[Placeholder] A longer intro for the crew can replace this note.",
  },
  sunday: {
    id: "sunday",
    kicker: "Stooopid Sunday",
    title: "Every Sunday, 10 AM",
    details: [
      "Every Sunday at 10 AM.",
      "Café Tranquille, 1442 Rue Clark.",
      "Meet at the café entrance.",
    ],
    note: "[Placeholder] Extra Sunday details can go here.",
    cta: {
      href: "https://anyonecanpacebeta.pages.dev/",
      label: "This week's details",
    } satisfies RunLink,
  },
  faqs: {
    id: "faq",
    title: "FAQs",
    intro: "[Placeholder] These questions and answers are stand-ins until the crew writes them.",
    items: [
      {
        question: "[Placeholder] Who can come?",
        answer: "[Placeholder] Answer coming from the crew.",
      },
      {
        question: "[Placeholder] What should I bring?",
        answer: "[Placeholder] Answer coming from the crew.",
      },
      {
        question: "[Placeholder] How do I find the group?",
        answer:
          "[Placeholder] Meet at the Café Tranquille entrance, 1442 Rue Clark. More detail coming from the crew.",
      },
      {
        question: "[Placeholder] What if I am new?",
        answer: "[Placeholder] Answer coming from the crew.",
      },
    ],
  },
  pacing: {
    id: "pacing",
    title: "Pacing app",
    body: "[Placeholder] Short blurb about the crew pacing app.",
    cta: {
      href: "https://anyonecanpacebeta.pages.dev/",
      label: "Open the pacing app",
    } satisfies RunLink,
  },
  photos: {
    id: "photos",
    title: "Photos",
    intro: "[Placeholder] Crew photos will replace these cards.",
    follow: {
      href: "https://www.instagram.com/stooopidcrew/",
      label: "Follow @stooopidcrew",
    } satisfies RunLink,
    emptyTitle: "[Placeholder] Photos are not available yet.",
    emptyBody: "[Placeholder] This card shows when the photos are missing or do not load.",
    loadingLabel: "Loading photos",
    previousLabel: "Previous photo",
    nextLabel: "Next photo",
    items: [
      {
        src: "/run/photos/01.webp",
        alt: "[Placeholder] Run crew photo 1",
        caption: "[Placeholder] Caption 1",
      },
      {
        src: "/run/photos/02.webp",
        alt: "[Placeholder] Run crew photo 2",
        caption: "[Placeholder] Caption 2",
      },
      {
        src: "/run/photos/03.webp",
        alt: "[Placeholder] Run crew photo 3",
      },
      {
        src: "/run/photos/04.webp",
        alt: "[Placeholder] Run crew photo 4",
        caption: "[Placeholder] Caption 4",
      },
      {
        src: "/run/photos/05.webp",
        alt: "[Placeholder] Run crew photo 5",
      },
      {
        src: "/run/photos/06.webp",
        alt: "[Placeholder] Run crew photo 6",
        caption: "[Placeholder] Caption 6",
      },
    ] satisfies RunPhoto[],
  },
  duck: {
    alt: {
      start: "Illustrated duck crouched in starting blocks",
      run: "Illustrated duck running",
      peek: "Illustrated duck peeking in from the edge",
      rest: "Illustrated duck jogging",
    } satisfies Record<DuckPose, string>,
    frames: {
      start: { src: "/run/duck/start.webp", width: 1057, height: 742 },
      runA: { src: "/run/duck/run-a.webp", width: 613, height: 797 },
      runB: { src: "/run/duck/run-b.webp", width: 613, height: 797 },
      peek: { src: "/run/duck/peek.webp", width: 832, height: 1114 },
      rest: { src: "/run/duck/rest.webp", width: 584, height: 750 },
    } satisfies Record<string, DuckFrame>,
  },
};

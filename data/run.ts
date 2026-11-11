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
  width: number;
  height: number;
  /** CSS object-position. Keeps faces inside the 3:2 card. */
  position?: string;
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
    scrollCue: "scroll",
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
    intro: "Photos from the crew.",
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
        src: "/run/photos/01-group-sunday.webp",
        alt: "Stooopid Run Crew group photo after a Sunday run",
        width: 1530,
        height: 1246,
        position: "50% 42%",
      },
      {
        src: "/run/photos/02-costume-run.webp",
        alt: "Crew in costumes at Café Tranquille",
        width: 1442,
        height: 848,
        position: "50% 45%",
      },
      {
        src: "/run/photos/03-autumn-tree.webp",
        alt: "Crew in front of a bright red autumn tree",
        width: 1120,
        height: 1026,
        position: "50% 62%",
      },
      {
        src: "/run/photos/04-lache-pas-la-patate.webp",
        alt: 'Crew holding a "Lâche pas la patate!" sign with the duck mascot',
        width: 1212,
        height: 1088,
        position: "50% 72%",
      },
      {
        src: "/run/photos/05-ca-vaut-le-pain.webp",
        alt: 'Crew holding "Ça vaut le pain" and "Forget legs, run with your heart" signs, with a golden retriever',
        width: 1212,
        height: 1088,
        position: "50% 62%",
      },
    ] satisfies RunPhoto[],
  },
  duck: {
    hopLabel: "Stooopid duck, hop",
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
      peekMobile: { src: "/run/duck/peek-mobile.webp", width: 819, height: 826 },
      rest: { src: "/run/duck/rest.webp", width: 584, height: 750 },
    } satisfies Record<string, DuckFrame>,
  },
};

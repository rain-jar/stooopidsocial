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
      "Stooopid Run Crew: running every Sunday 10 AM from Café Tranquille",
  },
  header: {
    homeLabel: "Les Stooopids",
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
    lede: "Sundays - 10 AM @ Café Tranquille",
    note: "All paces welcome. No experience needed. Because we believe - Anyone Can Run!",
    scrollCue: "scroll",
  },
  sunday: {
    id: "sunday",
    title: "Stooopid Sunday",
    details: [
      "Every Sunday at 10 AM.",
      "Café Tranquille, 1442 Rue Clark.",
      "Meet at the café entrance. Run starts at 10.15AM.",
    ],
    cta: {
      href: "https://anyonecanpacebeta.pages.dev/?sunday",
      label: "This week's details",
    } satisfies RunLink,
  },
  faqs: {
    id: "faq",
    title: "FAQs",
    intro: "You got stooopid questions? We got stooopid answers",
    items: [
      {
        question: "What can I expect",
        answer: "Expect to be funning. 🤣 \n\n For real - the goal is find the fun in running. And fun means having options. \n\n You have two options: \n \n * 6K Run - simple 6-7K run. \n\n * Walk + Run - To help slowly ramp up the running - for newer or injured runners. (see more below).   ",
      },
      {
        question: "What's the minimum or average pace",
        answer: "No minimum pace for either of our run group or walk + run group. The goal is to ensure no one is left behind. \n\n Feel free to walk if you have to, even in the run group. There will be a back pacer to guide you.",
      },
      {
        question: "What if I am new? Can I even do walk+run?",
        answer: "We all started somewhere. Ofcourse you can too! That's why the Walk+Run is called - Anyone Can Run. \n\n We will make sure to adapt to whatever you are able to do and slowly start from there. ",
      },
      {
        question: "Where exactly do you all meet?",
        answer:
          "Entrace to the Café Tranquille at 1442 Rue Clark. Right next to the Skating Rink. If you don't see anyone outside, we're most likely inside near the skating lockers. ",
      },
      {
        question: "Are there lockers to store things",
        answer: "Yes. There are lockers at the skating rink which is open to public use. Please do bring a lock. ",
      },
      {
        question: "What about restrooms or water fountains?",
        answer: "Yes. There are restrooms and water fountains at the café for public use ",
      },
      {
        question: "Is there a post-run hangout?",
        answer: "Duh 🙄 \n\n Ofcourse there is. That's when all the stooopidities happen. Every week we sit around and chat over some homemade chai. ",
      },
    ],
  },
  pacing: {
    id: "pacing",
    title: "Co-Pacing Buddy App",
    body: "You can be stooopid even on a weekday. This app can helps dress for your run, make your routes and even time your walk/runs \n\n Give it a go!",
    cta: {
      href: "https://anyonecanpacebeta.pages.dev/",
      label: "Open the pacing app",
    } satisfies RunLink,
  },
  photos: {
    id: "photos",
    title: "Photobooth",
    intro: "Proof of recent stooopidities",
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

export type EventStatus = "cancelled" | "postponed";

export type CommunityEvent = {
  id: string;
  slug: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  timezone: "America/Toronto";
  venue: string;
  address?: string;
  image?: {
    src: string;
    alt: string;
    position?: string;
  };
  artwork: "photo" | "dance" | "run" | "birthday";
  rsvpUrl?: string;
  status?: EventStatus;
};

export const events: CommunityEvent[] = [
  {
    id: "photo-walk-2026-10-24",
    slug: "photo-walk-westmount-2026-10-24",
    name: "Photo Walk",
    description:
      "Join us for an afternoon of photography with Bières et Caméras! We’ll follow an autumn route through Summit Woods, stop at the Summit Circle lookout, and finish with a well-deserved get-together at Siboire Notre-Dame. Whether you shoot on film, digital, or just use your phone, you’re welcome to join, discover a corner of Montreal from a new perspective, and meet some great people. More details are available in the community’s General chat.",
    startsAt: "2026-10-24T13:00:00-04:00",
    timezone: "America/Toronto",
    venue: "Côte-des-Neiges metro station",
    address: "Côte-des-Neiges metro station, Montréal, QC",
    image: {
      src: "/events/photo-walk.png",
      alt: "Photo Walk Westmount event poster",
      position: "center 42%",
    },
    artwork: "photo",
  },
  {
    id: "west-coast-swing-2026-10-20",
    slug: "west-coast-swing-night-2026-10-20",
    name: "West Coast Swing Night",
    description:
      "La Soirée Westie du Mardi is a weekly social dance event dedicated to West Coast Swing. It’s a friendly, relaxed space where dancers of all levels can practise their moves, enjoy the music, meet new people, and share their love of dancing. Our very own Raj will be DJing. More details are available in the community’s Swingers chat.",
    startsAt: "2026-10-20T20:30:00-04:00",
    endsAt: "2026-10-20T22:30:00-04:00",
    timezone: "America/Toronto",
    venue: "Espace des fins",
    address: "Espace des fins, Montréal, QC",
    artwork: "dance",
  },
  {
    id: "stooopid-runs-2026-10-25",
    slug: "stooopid-runs-2026-10-25",
    name: "Stooopid Runs",
    description:
      "Choose between our classic run or our Anyone Can Run initiative with guided 30-minute run/walk intervals. Don’t feel like running? You’re welcome to join the usual post-run hang and celebrate the weekend with a glass of chai. More details are available in the community’s Stooopid Run Crew chat.",
    startsAt: "2026-10-25T10:00:00-04:00",
    timezone: "America/Toronto",
    venue: "Café Tranquille",
    address: "Café Tranquille, Montréal, QC",
    artwork: "run",
  },
  {
    id: "stooopid-birthday-2026-11-07",
    slug: "stooopid-birthday-2026-11-07",
    name: "Stooopid Birthday",
    description:
      "Further particulars are pending, but the date itself is not to be missed. More details will be shared in the community’s General chat.",
    startsAt: "2026-11-07T16:00:00-05:00",
    timezone: "America/Toronto",
    venue: "To be announced",
    image: {
      src: "/events/stooopid-birthday.png",
      alt: "Stooopid duck carrying a first-birthday cake",
      position: "center",
    },
    artwork: "birthday",
  },
];

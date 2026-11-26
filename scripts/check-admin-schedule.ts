import {
  canDeleteManagedEvent,
  groupManagedEvents,
} from "../lib/events/admin-schedule";

const now = new Date("2026-11-26T16:00:00-05:00");

const pendingFuture = {
  starts_at: "2026-12-05T13:00:00-05:00",
  ends_at: "2026-12-05T16:00:00-05:00",
  moderation_status: "pending" as const,
  submitted_at: "2026-11-26T10:15:00-05:00",
  name: "Pending future",
};
const pendingPast = {
  starts_at: "2026-11-20T09:00:00-05:00",
  ends_at: "2026-11-20T12:00:00-05:00",
  moderation_status: "pending" as const,
  submitted_at: "2026-11-19T18:00:00-05:00",
  name: "Pending past",
};
const upcoming = {
  starts_at: "2026-11-29T10:00:00-05:00",
  ends_at: "2026-11-29T11:30:00-05:00",
  moderation_status: "approved" as const,
  submitted_at: "2026-10-01T09:00:00-05:00",
  name: "Sunday run",
};
const recurring = {
  id: "44444444-4444-4444-8444-444444444444",
  slug: "stooopid-gliders",
  name: "Ice skating",
  description: "x",
  venue: "rink",
  starts_at: "2026-10-25T11:30:00-04:00",
  ends_at: "2026-10-25T13:00:00-04:00",
  moderation_status: "approved" as const,
  submitted_at: "2026-10-01T09:30:00-05:00",
  recurrence_frequency: "weekly" as const,
  recurrence_weekdays: [0],
  recurrence_end_date: "2027-03-28",
};
const later = {
  starts_at: "2026-12-08T20:30:00-05:00",
  ends_at: "2026-12-08T22:30:00-05:00",
  moderation_status: "rejected" as const,
  submitted_at: "2026-11-10T12:00:00-05:00",
  name: "Swing",
};
const archived = {
  starts_at: "2026-11-01T10:00:00-04:00",
  ends_at: "2026-11-01T11:30:00-04:00",
  moderation_status: "approved" as const,
  submitted_at: "2026-10-10T09:00:00-05:00",
  name: "Halloween",
};

const groups = groupManagedEvents(
  [later, archived, recurring, upcoming, pendingPast, pendingFuture],
  now,
);

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(groups.pending.map((item) => item.event.name).join(",") === "Pending future,Pending past", `pending order: ${groups.pending.map((item) => item.event.name)}`);
assert(groups.upcoming.map((item) => item.event.name).join(",") === "Sunday run,Ice skating,Swing", `upcoming order: ${groups.upcoming.map((item) => item.event.name)}`);
assert(groups.archived.map((item) => item.event.name).join(",") === "Halloween", `archived: ${groups.archived.map((item) => item.event.name)}`);
assert(groups.upcoming[1].schedule.displayStartsAt.startsWith("2026-11-29"), `recurring next is ${groups.upcoming[1].schedule.displayStartsAt}`);
assert(!canDeleteManagedEvent(pendingFuture, now), "pending future must not be deletable");
assert(!canDeleteManagedEvent(pendingPast, now), "pending past must not be deletable");
assert(!canDeleteManagedEvent(upcoming, now), "upcoming must not be deletable");
assert(!canDeleteManagedEvent(recurring, now), "recurring upcoming must not be deletable");
assert(!canDeleteManagedEvent(later, now), "rejected future must not be deletable");
assert(canDeleteManagedEvent(archived, now), "archived must be deletable");
console.log("admin-schedule checks passed");

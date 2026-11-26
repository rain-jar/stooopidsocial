# 025 — Organize the Manage events admin page

## Request

The events admin at `/links/manage/events` is too crowded to scan (t80u, 26 Nov 2026, America/Toronto). Raj asked to:

- Delete or archive older events
- Turn each event into an expandable bar (title plus relevant details; expand to review or edit)
- Sort the bars by date, closest to farthest

This is a proposal only. Do not implement until Raj approves it.

## Current page

The page is auth-gated (`getAdminSession`; unauthenticated visitors go to `/links/manage`). It loads up to 500 parent rows from `public.events` with `getManagedEvents()`, ordered by `moderation_status` then `submitted_at` descending, not by event date. Recurring events are one parent row; occurrences live in `event_occurrences`.

Every event is already a full, always-open card: image, every edit field, Save, Approve, Reject, and Delete. There is no collapse, no grouping, and no date sort, so pending submissions sit mixed in with approved and past events.

Statuses already on the row:

- `moderation_status`: `pending`, `approved`, or `rejected`
- `event_status`: scheduled (empty), `postponed`, or `cancelled`

There is no archive or hidden column.

Delete already exists on every event, with a required "Permanently delete" checkbox (the action route also requires that confirm). Deleting the parent row also removes `event_occurrences` (`on delete cascade`) and the stored image.

Past-event logic already exists for the public board (`isEventPast`: `endsAt ?? startsAt` is before now). The admin page already formats dates in `America/Toronto`.

## Proposal

Reorganize the existing page in the UI only. Prefer native `<details>` / `<summary>` for both the event bars and the Archived section.

### Sections

1. **Pending review** at the top, only `moderation_status === "pending"`. This is the review queue, so sort it by `submitted_at` newest first. A pending event stays here even if its date has already passed, so an old submission cannot hide in Archived before it is reviewed.
2. **Upcoming**, everything else that is not yet past, including approved and rejected future events. Sort by date, closest first. Recurring events use their **next** occurrence.
3. **Archived**, a section that starts collapsed, with the count in the summary (`Archived (12)`). This is every non-pending event whose date has passed. Sort by date, most recently ended first (still closest to today, then farther back).

Empty sections are omitted.

### Collapsed bar

One line: date, title, status badge, and organizer name when present.

- Date is the start in `America/Toronto` (the next occurrence for a recurring event; the original start for a pending event with no upcoming occurrence).
- The badge shows moderation status, and also Postponed or Cancelled when `event_status` is set.
- Recurring events can show a small "Repeats" hint on the same line if space allows.

The expanded panel keeps the current edit form, image, Save, and Approve / Reject actions. All bars start collapsed.

### Archive, derived from the date (no SQL)

An event is archived when it is not pending and its effective end is before now, using `America/Toronto` and the same rule as `isEventPast` (`ends_at ?? starts_at`).

For a recurring event, use the last generated occurrence (from the recurrence fields already on the row, via the existing occurrence helper). If that last end is still in the future, the event stays in Upcoming and is sorted by the next occurrence start. No new database column, and no change to stored rows.

### Delete

Show Delete only inside an expanded Archived bar, still with the confirm checkbox. The action route should also refuse a delete unless the event is past (and still confirmed), so a crafted request cannot delete an upcoming or pending event. Reject stays available in the expanded form for events that are not already rejected.

### Files to change

- `app/links/manage/events/page.tsx` — sections, sorting, `<details>` bars, hide Delete outside Archived
- `app/links/manage/events/actions/route.ts` — allow `delete` only for past, confirmed events
- A small helper (for example `lib/events/admin-schedule.ts`) to compute next/last occurrence and whether a row is past
- A presentational list component (for example `components/events/ManagedEventList.tsx`) so the layout can be screenshot without a login
- This document

No migration. No change to the public calendar or to `getManagedEvents` query shape, other than sorting in the page after fetch.

## QA

The manage page requires auth, so screenshots cannot use the live admin URL as-is.

Plan: render the list component with fixture data (pending, upcoming one-off, upcoming recurring, rejected future, past approved, past with no organizer) in a local Playwright script, at Chromium 390 and 1280. Check:

- Pending is at the top; Upcoming is date-sorted; Archived is collapsed and shows a count
- Collapsed bars stay one line and do not collide at 390
- Expanding a bar shows the existing form
- Delete appears only in Archived, and still requires confirm
- Recurring fixtures sort by next occurrence, not the original start
- A pending event whose date has passed still appears under Pending review

Do not add a public preview route.

## Out of scope

- Auto-deleting anything
- Changing how the public board filters past events
- A new admin status or archive column

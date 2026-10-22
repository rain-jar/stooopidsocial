# Event Card Grid and Modal

- Status: Complete
- Date: 2026-10-22
- Source requirements: Collaborative homepage-redesign discussion using Westie Montréal and Nomads.com as references, narrowed to the event-card grid and event-details modal.
- Approval: Approved by the user on 2026-10-22. Initial event content was supplied through the attached “Stooopid Times” flyer; fallback artwork was authorized where event imagery is unavailable.

## Objective

Replace the homepage's calendar-dominated event presentation with a responsive, image-led upcoming-event card grid backed by static local data. Each card opens an accessible event-details modal that can later be replaced by a dedicated event page without rewriting the core details UI.

## Current-State Findings

- The homepage is a server component at `app/page.tsx`.
- It currently renders a heading, tagline, and embedded Google Calendar.
- Shared styling is minimal and primarily uses Tailwind utility classes plus `app/globals.css`.
- There is no event data model, event component, modal, API layer, or test suite.
- The project already has React and Next.js capabilities sufficient for this work; no dependency is required.
- The working tree contains existing dependency updates, documentation, and an untracked `app/run/` route. These changes must be preserved.

## Scope

### Static event model

Create a typed local event structure with:

- `id`
- `slug`
- `name`
- `image` and optional focal-position metadata
- `description`
- `startsAt`
- `endsAt`
- `timezone`
- `venue`
- `address`
- optional `rsvpUrl`
- optional explicit status for cancellation

### Event card grid

- Replace the embedded calendar on the homepage with an upcoming-event grid.
- Use responsive columns: one on mobile, two where space permits, and three on desktop.
- Use a fixed-ratio, full-background event image with a standardized dark gradient.
- Show a date badge, event name, time, place, and subtle “View details” cue.
- Make the entire card interactive.
- Limit titles to two lines and locations to one line while retaining full content in the modal.
- Provide consistent hover, pressed, keyboard-focus, missing-image, and broken-image states.
- Use branded fallback artwork when no usable image exists.

### Event details modal

- Reuse a presentation-neutral `EventDetails` component inside an `EventModal` wrapper.
- Render as a centered dialog on desktop and a bottom sheet on mobile.
- Support a visible close control on all devices, Escape on desktop/keyboards, and swipe-down dismissal on mobile.
- Trap focus while open and return focus to the originating card after close.
- Synchronize the selected event with `?event=<slug>` for refresh, sharing, and browser back-button behavior.
- Show event image, status, name, date/time, venue/address, full description, map action, RSVP state, and share action.
- If `rsvpUrl` exists, show “RSVP here” and clearly indicate that it opens an external site in a new tab.
- If `rsvpUrl` is absent, show “Just show up — no RSVP needed” as non-interactive confirmation.
- Provide “Open in Maps” using the event address.
- Use the native share interface where supported, with clipboard-copy fallback and “Link copied” feedback.

### Time and status behavior

- Treat the event's Montreal timezone as canonical and display it clearly.
- Use the browser timezone without requesting geolocation permission.
- When the visitor's timezone differs, show the converted visitor-local time as secondary information.
- Derive past status from `endsAt` and the event timezone.
- Exclude past events from the upcoming grid.
- If a past event is opened through its URL, retain the details and show a “Past event” status.
- For explicitly cancelled events, show “Cancelled,” retain the event for clarity, and disable RSVP.

### Loading, empty, and error states

- Use card-shaped skeletons only when content is genuinely pending.
- Open the modal immediately from card data; use an internal skeleton only for any future additional content load.
- Show a friendly empty state with a future-compatible “Suggest an event” direction.
- Keep the modal shell open on detail failure and provide Retry and Close actions.

## Proposed Component Boundaries

- `data/events.ts`: typed static event records
- `components/events/EventGrid.tsx`: responsive rendering and upcoming-event selection
- `components/events/EventCard.tsx`: visual card and interaction entry point
- `components/events/EventDetails.tsx`: reusable event content independent of modal/page presentation
- `components/events/EventModal.tsx`: dialog/bottom-sheet presentation, focus, dismissal, and URL coordination
- `components/events/EventStatus.tsx`: past/cancelled status presentation if separation improves clarity
- `app/page.tsx`: homepage composition only
- `app/globals.css`: only shared styles that cannot remain local utility classes

Exact file boundaries may be reduced during implementation if a smaller coherent structure remains readable and future-ready.

## Non-Goals

- Search and filtering
- Homepage hero redesign
- Join or suggest-event participation section
- “Coming up next” horizontal strip
- Calendar view
- Dedicated event pages
- Native accounts, authentication, or RSVP storage
- Google Calendar integration
- User-submitted events or moderation
- New visual identity, design system, or dependency
- Deployment

## Decisions and Open Questions

### Approved decisions

- Use Nomads-inspired compact image-overlay cards without copying its brand identity.
- Use static local data for the MVP.
- Keep event descriptions in the modal, not on cards.
- Use a modal now and preserve a reusable details component for future `/events/[slug]` pages.
- Use branded fallback artwork to normalize missing or inconsistent imagery.

### Content resolution

The initial dataset contains Photo Walk, West Coast Swing Night, Stooopid Runs, and Stooopid Birthday. The flyer provides descriptions and scheduling details; unspecified end times remain absent rather than inferred. West Coast Swing Night is retained as a past event. Stooopid Birthday uses “To be announced” for its missing venue/details. No event has an external RSVP link, so each eligible event uses the approved “Just show up” state. The canonical IANA timezone is `America/Toronto`, displayed to users as “Eastern Time.”

## Risks and Mitigations

- **Image readability:** enforce fixed ratios, cover cropping, focal positioning, and a consistent contrast gradient.
- **Modal complexity:** keep event content separate from modal mechanics and avoid third-party modal dependencies.
- **Mobile dismissal accessibility:** swipe-down supplements rather than replaces a visible close control.
- **Timezone confusion:** show canonical event time first and visitor-local conversion only as secondary information.
- **External-link safety:** permit only valid HTTP(S) destinations and use safe new-tab attributes.
- **URL synchronization defects:** verify refresh, direct links, close behavior, and browser back/forward navigation.
- **Future page migration:** keep `EventDetails` independent of the modal wrapper and assign stable slugs now.

## Rollback

The change is isolated to new event data/components and the homepage event section. Rollback consists of restoring the existing calendar section in `app/page.tsx` and removing the new event-specific files. No migration or persistent data is involved.

## Acceptance Criteria

- The homepage presents upcoming events in a responsive image-overlay grid.
- Cards remain readable with bright, dark, missing, and broken images.
- Each card exposes name, date, time, place, and a details cue without showing description.
- The whole card works by pointer, keyboard, and touch with visible interaction feedback.
- Opening a card presents the correct desktop dialog or mobile bottom sheet.
- Focus is contained and restored correctly; keyboard dismissal works.
- Mobile swipe-down dismissal works without being the only close mechanism.
- Modal URLs are shareable, survive refresh, and respect browser back/forward behavior.
- RSVP, no-RSVP, map, share, past, and cancelled states behave as specified.
- Static event data is typed and isolated from presentation components.
- No new dependency, authentication system, API, event submission, or deployment is introduced.
- Existing header, footer, `/run` route, and unrelated behavior remain unchanged.

## Verification Plan

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npm run build` using the normal build path; document any environment-specific limitation and use the supported webpack build path only if required for verification.
- Inspect the full diff and confirm unrelated working-tree changes remain untouched.
- Verify desktop and mobile layouts at representative supported widths.
- Verify mouse hover, touch pressed state, keyboard traversal, focus ring, Enter/Space activation, Escape dismissal, focus trapping, and focus restoration.
- Verify close button and mobile swipe-down behavior.
- Verify direct modal URL, refresh, link copying/native sharing where supported, and browser back/forward behavior.
- Verify cards with long names/locations and bright, dark, missing, and broken images.
- Verify RSVP-link, no-RSVP, past, cancelled, loading, empty, and error states.

## Security and Privacy Impact

No authentication, persistent user data, location permission, or new external service is introduced. Browser timezone is read locally only for display conversion. External RSVP and map actions can navigate away from the site; destinations must be constrained to valid HTTP(S) URLs, clearly indicated, and opened with safe new-tab protections. Share behavior transmits only the public event URL and user-initiated event summary through the device share mechanism. No sensitive data should be collected or stored.

## Actual Changes

- Added typed static records for the four flyer events, using `America/Toronto` as the canonical timezone and “Eastern Time” in the interface.
- Added responsive image-overlay event cards, generated local event artwork, deterministic fallback artwork, upcoming-event filtering, and empty/loading presentation.
- Added reusable event details plus a URL-synchronized native dialog that becomes a bottom sheet on mobile.
- Added close, Escape, focus restoration, swipe-down, map, share, no-RSVP, past-event, broken-image, and invalid-event handling.
- Replaced only the homepage calendar section; the existing header, hero, footer, and `/run` route structures were retained.
- Registered and preserved the user-provided copy refinements: “Les Stooopids” in the header and footer, and “Upcoming stooopidities” above the event grid.
- No package, route, API, authentication, persistence, or deployment change was introduced.

## Verification Evidence

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build -- --webpack`: passed, including TypeScript and static generation for `/`, `/_not-found`, and `/run`.
- `git diff --check`: passed.
- Browser inspection passed at the default desktop viewport and at 390 × 844 mobile: responsive grid, centered dialog, bottom sheet, imagery, text contrast, close control, and Eastern Time labels rendered correctly.
- Opening a card added its stable `?event=` URL; Escape removed it and returned focus to the originating card.
- A direct URL to the past West Coast Swing event opened successfully, displayed “Past event,” omitted RSVP, and remained absent from the upcoming grid.
- The normal Turbopack build path could not be observed because its CSS worker attempted a prohibited local port bind in this environment. The repository-supported webpack build completed successfully instead.

## Residual Risk and Follow-up

- Native device sharing was not invoked because it would open an operating-system share surface; the guarded native-share/clipboard branches were reviewed in code.
- Mobile layout was visually verified, but physical touch-device swipe behavior and the full supported-browser matrix were not available in this environment. Swipe dismissal supplements the always-visible close control.
- Search/filtering, hero redesign, participation prompts, dedicated event pages, external calendar data, and event submissions remain explicitly deferred.

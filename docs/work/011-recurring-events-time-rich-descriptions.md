# Recurring Events, Time Entry, and Formatted Descriptions

## Status

Deployed; production end-to-end recurrence validation pending — the user approved the documented proposal on 2026-11-23. The additive migration and application release are live, but a real recurring submission has not yet completed the full moderation/publication lifecycle.

## Source Requirements

- Let a submitter opt into recurrence on desktop and mobile, configure when an event repeats, submit the series once, and show each approved occurrence as an individual event.
- Improve desktop time entry with the best of the discussed options while preserving the current mobile-native time experience.
- Support links, bullet lists, underline, and strikethrough in event descriptions on desktop and mobile.
- Make every date field's calendar affordance visible on dark or light backgrounds and open the native calendar when any part of the field is clicked, while retaining manual entry.
- Preserve the existing visual language, account-free submission, moderation gate, Eastern Time convention, private-image workflow, and event-card/modal behavior.

## Objective

Add a bounded, moderation-safe recurring-event workflow; make desktop time selection fast and predictable in 15-minute increments; and add safe, lightweight description formatting without accepting arbitrary HTML or adding editor dependencies.

## Current-State Findings

- A public submission creates one pending row in `public.events`; an administrator edits and approves that row from `/links/manage/events`.
- Approved events are fetched through the existing Supabase repository and mapped to the established `CommunityEvent` contract.
- Dates and times are submitted as Eastern local values and converted server-side to `timestamptz`, including DST validation.
- Desktop and mobile currently use the browser's native `input[type="time"]`; desktop browser UX is the reported problem.
- Descriptions are bounded plain text and rendered as a React text node. This is safe but cannot express links or formatting.
- Event images belong to the parent event and are delivered through protected application routes from a private Supabase bucket.
- No automated test framework or rich-text dependency is configured.

## Scope

### Recurrence

- Add an `event_occurrences` table linked to the existing `events` row, plus bounded recurrence metadata on the parent event.
- Support non-recurring, weekly, every-two-weeks, and monthly schedules.
- For weekly and every-two-weeks schedules, allow one or more weekdays; default to the selected start-date weekday.
- Require recurrence to end either on an Eastern calendar date or after a selected number of occurrences.
- Cap a series at 52 occurrences and keep every generated start within the existing two-year submission horizon.
- Treat the submitted start/end as the anchor occurrence and preserve its duration for generated occurrences across Eastern DST changes.
- For monthly recurrence, repeat on the anchor day-of-month and skip months that do not contain that day.
- Moderate the parent series once. Approval transactionally replaces and publishes its generated occurrence rows; pending or rejected series expose no occurrences publicly.
- Display each occurrence as a separate card and modal with a unique occurrence slug and its own start/end time, while reusing the parent event's details and private image.
- Keep administration series-oriented in this phase: edits to an approved series regenerate all occurrences from the current rule. Rejecting or deleting the parent removes linked occurrences through cascading deletion.

### Time entry

- Keep the native mobile time input.
- On desktop, use an accessible select/combobox-style control offering 15-minute increments with readable 12-hour labels and a `Custom time` path for values outside those increments.
- Submit one canonical `HH:mm` value through the existing server validation; no date/time contract changes.

### Date entry

- Use one shared date control for start, end, and recurrence-end dates in public and administrator forms.
- Display a custom calendar icon using inherited foreground color so it adapts with the field theme instead of relying on inconsistent native indicator styling.
- On direct field activation, call the browser-native picker through feature detection and retain native focus/manual entry as the fallback.
- Apply the selected start date as the minimum for end and recurrence-end date controls.

### Formatted descriptions

- Add a responsive toolbar to the public and administrator description fields for links, bullet lists, underline, and strikethrough.
- Store a small, documented plain-text markup subset rather than HTML:
  - `- item` for bullet lists
  - `[label](https://example.com)` for links
  - `++text++` for underline
  - `~~text~~` for strikethrough
- Render the subset through React elements only. Raw HTML remains inert text, and only absolute HTTP/HTTPS links become anchors.
- Preserve the current 5,000-character server and database limit.

## Non-Goals

- User accounts, ownership, RSVP management, notifications, calendar synchronization, or recurrence exceptions.
- Editing or cancelling only one occurrence; this phase updates or removes the full series.
- Daily, yearly, arbitrary RRULE, ordinal weekday, or never-ending recurrence.
- A general-purpose WYSIWYG editor, arbitrary Markdown, arbitrary HTML, embedded media, headings, or new dependencies.
- Redesigning event cards, modals, mobile date/time controls, moderation authentication, or private-image storage.

## Proposed Approach

1. Add an additive Supabase migration with recurrence columns on `events` and a child `event_occurrences` table. Enable RLS, revoke default access, grant anonymous selection only for occurrences whose parent is approved, and retain service-role-only mutations.
2. Add shared recurrence validation and deterministic Eastern-Time occurrence generation in application code. Send the generated occurrence set to a service-role-only transactional database function for approval/regeneration so partial series cannot become public.
3. Extend public submission validation and persistence with the bounded recurrence rule. The prepare/upload security flow remains unchanged.
4. Extend moderation to show the submitted recurrence summary and recurrence controls. Approval or updates regenerate linked occurrences atomically.
5. Extend the repository to map non-recurring parent rows normally and recurring child rows to unique `CommunityEvent` instances. Child instances reuse the approved parent's image URL and content.
6. Add a shared responsive time-field component: native time input below the desktop breakpoint and 15-minute desktop options with an explicit custom-time escape hatch.
7. Add a shared description editor toolbar and safe renderer for the restricted plain-text markup. Use the editor in public submission and moderation, and the renderer in event details.
8. Update the living implementation record with actual changes and verification evidence after implementation.

## Affected Components and Interfaces

- `supabase/migrations`: additive recurrence schema, policies, grants, indexes, and transactional approval/regeneration function.
- `components/events/EventSubmissionDialog.tsx`: recurrence fields, responsive time controls, and formatted-description editor.
- `components/events/EventDetails.tsx`: safe formatted-description rendering.
- `app/api/event-submissions/route.ts`: recurrence validation and pending-parent persistence.
- `app/links/manage/events/page.tsx`: series review/editing controls and recurrence summary.
- `app/links/manage/events/actions/route.ts`: atomic series approval/regeneration and full-series updates.
- `lib/events/validation.ts`: recurrence input validation and Eastern-Time generation.
- `lib/events/repository.ts`: occurrence-aware public mapping and administration reads.
- `data/events.ts`: no breaking change planned for the public `CommunityEvent` contract.
- Existing private image, Turnstile, session, CSRF, cache invalidation, Google Calendar, RSVP, map, and sharing interfaces remain in place.

## Decisions and Open Questions

Recommended decisions included in the requested approval:

1. Use weekly, every-two-weeks, and monthly recurrence only.
2. Require an end date or occurrence count and cap the result at 52 occurrences within two years.
3. Skip invalid monthly dates rather than silently moving them to a month's final day.
4. Moderate and edit a series as one unit; per-occurrence exceptions remain future work.
5. Use a dependency-free restricted markup toolbar rather than HTML or a general-purpose rich-text package.
6. Use a desktop 15-minute selector with a custom-time escape hatch and retain native mobile time inputs.

No unresolved user decision remains if these defaults are approved.

## Security Impact

### Weakness and exposure

Recurrence increases the amplification available to an anonymous submitter: one accepted request can create many public records and cache entries. Formatted descriptions introduce stored link content and parser/rendering risk. Schema and policy mistakes could expose pending series or permit unauthorized occurrence writes. The affected surfaces are public submission APIs, moderation actions, Supabase Postgres/RLS, cached public event reads, event modals, and supported desktop/mobile browsers.

Severity would be high if pending content became public, service-role-only functions were callable by anonymous users, or stored markup enabled script execution. With bounded generation, moderation-first visibility, default-deny grants, React-only rendering, and URL allowlisting, expected residual risk is low to moderate.

Dependency verification also identified newly published moderate Next.js advisories affecting the existing 16.4.2 installation. That independent open finding is documented in [SEC-2026-002](../security/SEC-2026-002-nextjs-moderate-advisories.md); remediation requires separate dependency-change approval.

### Remediation and controls

- Cap each series at 52 validated occurrences and retain existing request-size, rate-limit, Turnstile, honeypot, and future-date controls.
- Generate occurrences server-side only; never trust client-generated timestamps or occurrence counts.
- Preserve Eastern wall-clock time across DST and reject nonexistent local times.
- Materialize or regenerate occurrences in one database transaction; never publish a partially generated series.
- Enable RLS on the occurrence table, grant public read only through an approved parent, and grant all mutations/functions only to `service_role`.
- Keep pending/rejected series and occurrence metadata out of public queries, HTML, RSC payloads, API responses, and caches.
- Do not render description HTML or use `dangerouslySetInnerHTML`. Parse only the allowlisted syntax into React elements.
- Allow only absolute `http:` and `https:` description links and apply safe external-link attributes.
- Bound parser work by the existing 5,000-character description limit and render malformed markup as text.
- Continue validating all content during public submission and administrator updates; formatted content remains subject to human moderation.

### Data and user impact

Approved recurrence schedules and formatted descriptions are intentionally public. A series produces multiple public event URLs and calendar entries. No new personal data is collected, and the private image remains stored once and accessed through the existing protected route.

### Alternatives and compatibility

- Duplicating independent event rows at submission time was rejected because it complicates moderation, can partially publish a series, and duplicates image ownership.
- Expanding recurrence only at render time was rejected because pagination, stable URLs, moderation, cancellation, and future querying become unreliable.
- Arbitrary RRULE was rejected because it materially expands validation and denial-of-service risk.
- Raw HTML/contenteditable and general-purpose rich text were rejected because they add a larger XSS and dependency surface for a small formatting requirement.
- A desktop analog clock was rejected because a 15-minute selector is faster for keyboard and mouse use, easier to scan, and simpler to make accessible while retaining custom-time support.

The migration is additive. Existing non-recurring events retain current behavior. The public `CommunityEvent` interface remains stable, limiting presentation regressions.

### Security verification

- Inspect migration grants, RLS policies, foreign keys, cascade behavior, function ownership, fixed `search_path`, and service-role-only execution.
- Verify anonymous users cannot select pending/rejected occurrences or insert/update/delete any series or occurrence.
- Exercise recurrence caps, malformed rules, invalid weekdays, past/far-future dates, DST gaps, monthly missing dates, and duplicate generation.
- Verify approval/update is atomic under forced failure and repeated requests are idempotent.
- Exercise raw HTML, script-like text, malformed links, encoded protocols, nested/unfinished markup, long descriptions, and link attributes.
- Inspect public payloads and caches for moderation fields or hidden occurrence data.
- Re-run production dependency audit even though no dependency is planned.

### Rollout, monitoring, rollback, disclosure, and residual risk

- Apply the additive migration before deploying application code; keep public submissions disable-able through the existing configuration switch.
- Monitor sanitized submission failures, recurrence validation failures, moderation failures, and public repository errors without logging descriptions or identifying data.
- Roll back application code to ignore recurrence metadata and disable submissions if necessary. Existing events remain readable; occurrence rows can remain dormant without destructive rollback.
- No vulnerability is being disclosed; this is preventive hardening for expanded stored-content and record-generation surfaces.
- Human-approved links can still lead to unsafe third-party sites, and moderation remains necessary. The existing shared administrator passcode and broad server-side service-role credential remain unchanged residual risks.

## Risks and Rollback

- **Incorrect recurrence dates:** deterministic generation will be verified around DST, month boundaries, leap years, and selected weekdays before migration use.
- **Partial approval:** a transactional database function prevents parent approval unless the complete occurrence set is stored.
- **Moderation overload:** one series appears once in the queue, with an explicit schedule summary and occurrence count.
- **Unexpected public volume:** hard caps and repository limits prevent unbounded expansion.
- **Markup regression:** malformed or unsupported syntax falls back to visible text; existing plain descriptions continue to render.
- **UI regression:** mobile retains native time inputs, and all new recurrence/formatting controls use existing form tokens and responsive breakpoints.
- **Rollback:** disable submissions, restore the prior application revision, and leave additive recurrence columns/table unused. No destructive schema reversal is required.

## Acceptance Criteria

- A visitor can submit a one-time event exactly as before.
- On desktop and mobile, a visitor can enable recurrence, configure a supported bounded schedule, and submit one series for review.
- Pending or rejected series and occurrences are not publicly readable.
- An administrator sees and edits the series once; approval publishes the complete validated occurrence set atomically.
- Each approved occurrence appears independently in chronological order, opens a stable modal URL, carries the correct Eastern date/time and duration, and supports the existing image, map, RSVP, share, and Google Calendar behaviors.
- Desktop start/end time entry offers 15-minute choices and custom times; mobile retains its native time picker.
- Public and administrator description fields provide usable link, bullet, underline, and strikethrough controls on desktop and mobile.
- Approved formatting renders correctly without interpreting raw HTML or unsafe URL schemes.
- Existing one-time events, private images, moderation, authentication, security controls, and caches continue to work.

## Verification Plan

- Inspect the complete diff and migration before applying it anywhere.
- Run `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm audit --omit=dev`, and `npm audit`.
- Run focused recurrence and description-parser fixtures with the existing runtime unless adding test tooling is separately approved.
- Verify one-time, weekly, biweekly, and monthly submissions; end-date and count limits; DST transition cases; missing monthly dates; and maximum-series rejection.
- Verify moderation approval, update/regeneration, rejection, deletion/cascade, repeated approval, and forced-failure atomicity against a controlled Supabase environment before production.
- Verify formatting controls and rendering with keyboard, touch, narrow mobile, and representative desktop layouts; confirm focus labels, link behavior, and malformed-input fallback.
- Verify public data exposure and private image delivery for a recurring series.
- Production migration, deployment, and remote writes remain separate actions requiring explicit authorization.

## Required Approval

Approve the proposed schema, recurrence limits/semantics, series-level moderation behavior, dependency-free description markup, security controls, and verification/rollback plan before implementation begins.

Approval was received on 2026-11-23. The user subsequently authorized production rollout and confirmed the Supabase migration was applied before the application release.

## Actual Changes

- Added an additive recurrence migration with bounded parent-series metadata, linked occurrence records, approval-only public RLS, service-role-only writes, cascading cleanup, indexes, grants, and a service-role-only transactional replace/publish function.
- Added server-side recurrence validation and deterministic Eastern-Time generation for weekly, biweekly, and monthly schedules, including DST preservation, monthly missing-date skips, stable occurrence slugs, a 52-occurrence limit, and the existing two-year horizon.
- Extended public submission persistence and administrator moderation with recurrence metadata. Approval and approved-series updates republish a complete generated occurrence set; pending series do not expose child records.
- Extended the public repository to page occurrence reads, map every occurrence to the existing `CommunityEvent` contract, preserve chronological order, and reuse the parent event's protected image.
- Added a shared responsive time field with 15-minute desktop options, a custom-time path, and the current native mobile picker.
- Added a shared date field across public and administrator forms with an inherited-color calendar icon, whole-field native picker activation, manual-entry fallback, and live start-date minimums for dependent dates.
- Added shared mobile/desktop recurrence controls for supported frequency, weekdays, and date/count endings.
- Added a dependency-free description toolbar and allowlisted React renderer for HTTP/HTTPS links, bullet lists, underline, and strikethrough. Raw HTML remains inert text.
- Converted formatted descriptions back to readable plain text when constructing Google Calendar URLs.
- Added no dependencies.

## Verification Evidence

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `npm run build -- --webpack`: passed, including compilation, TypeScript, page-data collection, and static generation. The existing local Google fallback logged its missing private-key configuration but did not fail the build.
- The default Turbopack build could not complete in the execution environment because its CSS worker was denied permission to bind a local port; this is an environment restriction rather than an application compile error.
- Focused runtime fixtures passed for one-occurrence schedules, weekly DST wall-clock preservation, biweekly multiple weekdays, monthly missing-date skips, invalid empty-weekday rejection, and description-to-plain-text conversion.
- Local production smoke test returned HTTP 200 for the homepage and preserved the authenticated management redirect boundary.
- The user applied the additive Supabase migration before application deployment. A post-migration anonymous read confirmed the recurrence columns and `event_occurrences` table are available through the intended public RLS boundary; no approved occurrence rows existed at verification time.
- Commit `f9703b8` was pushed to `origin/main`. The canonical Vercel production site returned HTTP 200 with the recurrence and formatting controls present, event submissions enabled, and `/links/manage/events` still redirecting unauthenticated visitors to the protected management login.
- `npm audit --omit=dev` reports one open moderate Next.js production finding; full `npm audit` reports eight moderate findings across Next.js and the existing development-only ESLint/minimatch chain. No audit fix was applied. The production framework finding is tracked in `docs/security/SEC-2026-002-nextjs-moderate-advisories.md`.

## Checks Not Run and Remaining Gates

- No recurring event has yet completed the real public submission, image upload, moderation, occurrence publication, update/regeneration, rejection, or deletion flow.
- The user visually reviewed the local desktop dialog, recurrence controls, formatting UI, time selector, and corrected date-field treatment. Dedicated mobile, keyboard-only, touch, and cross-browser checks remain outstanding.
- Transactional failure, cascade deletion, and service-role mutation grants have not yet been exercised against a disposable recurring series in production.
- The release is live; completion of the phase still requires one controlled recurring submission through moderation and public occurrence verification.

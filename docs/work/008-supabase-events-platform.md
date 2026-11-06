# Supabase Event Platform and Public Submissions

- Status: In progress — schema, import, and protected preview verified; production deployment pending
- Date: 2026-11-06
- Source requirement: Replace the Google Sheets/Drive event pipeline with a Supabase-backed event platform that lets any visitor submit an event through the website while preserving moderation, usability, efficiency, and strong security.
- Approval: Approved by the user on 2026-11-06, excluding collection of a contact email.
- Architectural decision: [ADR-001](../decisions/ADR-001-supabase-events-platform.md)
- Related dependency security record: [SEC-2026-001](../security/SEC-2026-001-dependency-vulnerabilities.md)

## Objective

Make Supabase the single source of truth for events, add a low-friction public event-submission experience, give the existing administrator a secure review workflow, and retire Google Sheets/Drive only after a verified, reversible cutover.

## Current-State Findings

- The homepage reads validated published rows from Google Sheets every five minutes and falls back to four local records on failure.
- Event images are resolved from published Sheet rows, verified against a restricted Drive folder, and proxied through a same-origin route.
- Event cards, modal details, past-event behavior, Google Calendar links, and date formatting consume a stable `CommunityEvent` contract.
- The existing **Add Your Event** control is visual only.
- Supabase is already installed and used by the links hub through server-only anon and service-role clients.
- The links administration area already has a signed HTTP-only session, CSRF protection, same-origin checks, and database-backed login throttling.
- Existing migrations enable RLS, revoke anonymous writes, and grant privileged operations only to `service_role`.
- No automated test framework is configured.
- The repository is clean on `main`; no unrelated local changes need preservation.

## Proposed User Experience

### Public submission

- **Add Your Event** opens an accessible form dialog on desktop and a full-height sheet on mobile, matching the existing event-modal interaction language.
- Required fields: event name, start date, start time, venue, and description.
- Optional fields: end date/time, address, RSVP URL, event image, and image alt text.
- Dates and times are entered and stored using `America/Toronto`; the form explains that displayed event times use Eastern Time.
- Images are previewed before submission and restricted to JPEG, PNG, or WebP. The client re-encodes supported images to remove metadata and bound dimensions/size before upload.
- Validation is shown next to the affected field. Submission progress prevents duplicate clicks.
- Success state says the event was submitted for review and is not live yet. It does not imply approval or promise a publication time.
- Submission does not require an account.

### Administration

- Add `/links/manage/events` inside the existing administrator session boundary.
- Show pending submissions first with image preview, event details, and approve/reject controls.
- Approval assigns/validates the public slug, records moderation timestamps, and makes the event eligible for public reads.
- Rejection keeps a minimal audit record but removes any stored image. Editing approved events is limited to the existing event fields; destructive deletion requires confirmation.
- The existing links-management workflow remains unchanged except for navigation to event moderation.

### Public calendar

- Keep the current cards, modals, Eastern Time display, past-event behavior, RSVP, maps, sharing, and Google Calendar handoff.
- Read only approved records and sort them chronologically.
- Keep branded fallback artwork when no approved image exists.
- Preserve the five-minute cache target and provide a safe empty/error state instead of silently rendering stale Google data after cutover.

## Proposed Data Model

### `events`

- `id uuid primary key`
- `slug text unique`, nullable while pending and required before approval
- `name text`
- `description text`
- `starts_at timestamptz`
- `ends_at timestamptz null`
- `timezone text`, constrained to `America/Toronto` for this phase
- `venue text`
- `address text null`
- `rsvp_url text null`
- `event_status text null`, constrained to `cancelled` or `postponed`
- `moderation_status text`, constrained to `pending`, `approved`, or `rejected`
- `image_path text null`
- `image_alt text null`
- `image_position text`
- `submitted_at`, `reviewed_at`, `created_at`, and `updated_at` timestamps

Database checks enforce lengths, timestamp ordering, URL schemes, status values, image-path shape, and approval requirements. Public queries use an explicit column allowlist that excludes private moderation fields.

### Submission rate limits

A private table stores only keyed hashes of network/user-agent identifiers, counters, and short expiry windows. Raw IP addresses and user-agent strings are not stored. Old limiter rows are pruned opportunistically.

### Storage

- Create a private `event-images` bucket.
- Limit object size and allow only JPEG, PNG, and WebP MIME types at the bucket level.
- Store randomized object paths; never use user filenames as object paths.
- Browser uploads use a short-lived, single-object signed upload token issued only after server validation and anti-automation checks.
- Finalization verifies object ownership/path, size, MIME type, and image signature before associating it with a pending event.
- The public image route resolves only approved events and never exposes the service-role credential or unrestricted bucket listing.

## Proposed Application Architecture

- Generalize the existing server-only Supabase client module so links and events share one correctly configured client boundary.
- Add an event repository that maps approved rows to the existing `CommunityEvent` interface.
- Replace `lib/google-events.ts` in the homepage and image route only after migration parity is verified.
- Add server endpoints for submission initialization/finalization with bounded payloads, strict validation, generic public errors, and sanitized diagnostics.
- Add database-backed rate limiting and a honeypot. Require Cloudflare Turnstile verification in production before issuing an upload token or accepting an image-free submission; use documented test keys locally.
- Extend the existing administrator CSRF, same-origin, session, and throttling patterns to moderation actions.
- Revalidate the homepage and affected image paths after approval, edit, rejection, cancellation, or deletion.

No new JavaScript dependency is proposed. Turnstile verification uses its server API directly, and image normalization uses browser-native canvas APIs for supported formats.

## Migration and Cutover

1. Create local SQL migrations, repository code, public form, moderation UI, and verification fixtures without changing production.
2. Apply the new schema, private bucket configuration, RLS/grants, and required secrets to a non-public/controlled environment.
3. Export the current `Events` Sheet tab as CSV and import validated records and approved images into Supabase with a one-time migration script. The script is idempotent by stable source ID/slug and never logs row contents or secrets.
4. Compare record counts, slugs, timestamps, statuses, RSVP URLs, and image availability between Google and Supabase.
5. Deploy code with a temporary server-side source switch that can roll back to Google without data loss. New public submissions go only to Supabase.
6. After production parity and submission/moderation tests pass, switch reads and image delivery to Supabase.
7. Remove Google runtime code, dependencies, environment variables, OIDC permissions, and service-account resource access in a separate cleanup commit after an agreed rollback window.

Production schema application, data import, secret changes, source cutover, Google decommissioning, commit, push, and deployment each remain remote-state actions and will be performed only after explicit approval at their respective gate.

## Scope

- Supabase schema, grants, RLS, private Storage bucket, and rate limiting
- Public event-submission form and accessible dialog/sheet behavior
- Signed image-upload flow and approved-image proxy
- Event repository and preserved `CommunityEvent` presentation contract
- Administrator moderation page and actions within the current authentication boundary
- One-time Google-to-Supabase data/image migration tooling
- Controlled source cutover, rollback switch, and eventual Google runtime cleanup
- Necessary environment documentation and an accurate update to the repository profile

## Configuration Contract

No values belong in tracked files. The local/Vercel configuration names are:

- Existing server-only Supabase values: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- Public browser upload values: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Source/cutover switches: `EVENTS_SOURCE` (`google` or `supabase`), `EVENTS_GOOGLE_FALLBACK` (`true` only during rollback window), and `EVENT_SUBMISSIONS_ENABLED`
- Submission security: `EVENT_SUBMISSION_TOKEN_SECRET`, `EVENT_SUBMISSION_RATE_LIMIT_SECRET`, and `TURNSTILE_SECRET_KEY`
- Public anti-automation key: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

The Supabase anon key is intentionally public but remains restricted by RLS and private Storage policies. The service-role key, submission secrets, and Turnstile secret are server-only and must never use a `NEXT_PUBLIC_` prefix.

## Non-Goals

- Public user accounts, profiles, event ownership, self-service editing, comments, invitations, payment, recurring events, or attendee RSVP management
- Automatic publication, AI moderation, arbitrary HTML/Markdown descriptions, SVG/GIF/HEIC uploads, or multiple images per event
- Replacing the existing administrator authentication in this phase
- Search/filter redesign, dedicated event pages, light mode, or unrelated visual changes

## Decisions and Open Questions

Recommended defaults requiring approval:

1. Keep submissions account-free but moderation-required.
2. Require Turnstile plus keyed database rate limiting and a honeypot in production.
3. Reuse the existing administrator passcode/session and place moderation at `/links/manage/events`.
4. Restrict uploads to one JPEG/PNG/WebP image, normalized client-side, with a 5 MB post-normalization limit and a maximum 2400-pixel edge.
5. Keep the private image proxy rather than exposing Supabase object URLs.
6. Use a staged cutover and retain Google rollback capability until production parity is confirmed.

## Security Impact

### Weakness and exposure introduced

The current system is read-only to public visitors. Adding an anonymous submission and upload surface introduces stored-content, spam, resource-exhaustion, malicious-file, enumeration, privacy, and moderation-bypass risks. A defect could expose pending event data, publish unsafe content, consume storage/function resources, or allow misuse of the server-only service role.

Affected surfaces include the homepage submission dialog, new submission APIs, `/links/manage/events`, moderation actions, the event image route, Supabase Postgres/Data API, Supabase Storage, Vercel Functions, supported desktop/mobile browsers, and Turnstile verification. The existing links administration route and Supabase service-role secret are shared trust boundaries.

Severity is high if anonymous writes or private reads are accidentally granted, because exploitation would be internet-accessible and persistent. With the proposed fail-closed RLS, server validation, moderation, and private bucket controls, expected residual exposure is moderate and primarily operational abuse.

### Remediation and controls

- Enable RLS on every event-related table; grant anonymous users only an allowlisted `SELECT` path for approved public fields.
- Revoke browser `INSERT`, `UPDATE`, and `DELETE`; perform narrowly validated writes only in server-only code using the existing service-role boundary.
- Keep private fields out of public selects and responses. Never log submission bodies, raw network identifiers, object tokens, or secrets.
- Validate and bound every field in both application code and database constraints; render descriptions as text only.
- Allow only `https:`/`http:` RSVP URLs and retain safe external-link attributes.
- Require moderation before publication and make approval rules fail closed.
- Use Turnstile, a honeypot, keyed identifier hashing, rate windows, payload limits, timeouts, duplicate-submit protection, and generic failure responses.
- Use private Storage, randomized paths, short-lived signed upload tokens, bucket MIME/size constraints, signature verification, and deletion of rejected/orphaned objects.
- Reject SVG and other active formats. Normalize supported images client-side to remove metadata and reduce resource use; verify the resulting server-side object before preview/public delivery.
- Protect moderation with the existing HTTP-only SameSite session, CSRF, same-origin checks, database login throttling, and confirmation for destructive actions.
- Cache only approved public data; never include pending/rejected records in cache keys or rendered client payloads.

### Data and user impact

Public event details and approved images are intended for publication. Visitors must be told that approved event content and images become publicly downloadable. No submitter contact information is collected in this phase.

### Alternatives and compatibility

Direct anonymous Supabase writes were rejected because they expand the public database contract and abuse surface. Writable Google integration was rejected because it requires broader Google privileges and does not solve image moderation cleanly. The existing event presentation contract remains stable, limiting UI regression risk.

The database migration and source cutover are breaking operational changes but not intended to change public event-card/modal behavior. Google remains available during the verified rollback window.

### Security verification

- Inspect migrations for RLS enabled, default-deny grants, policy column exposure, and service-role-only mutations.
- Exercise approved, pending, rejected, malformed, oversized, invalid-MIME, signature-mismatch, duplicate, expired-token, rate-limited, missing-Turnstile, CSRF, cross-origin, unauthorized-admin, and storage-enumeration cases.
- Confirm pending event fields, signed upload tokens, storage paths, service-role keys, and Turnstile secrets do not appear in HTML, RSC payloads, client bundles, public API responses, logs, or caches.
- Confirm the public image route cannot retrieve pending/rejected/unrelated objects and that rejected/orphaned images are deleted.
- Run dependency audits even though no dependency is planned.

### Rollout, monitoring, rollback, and disclosure

- Roll out behind a server-side source/submission switch and enable production submission only after schema and moderation verification.
- Monitor sanitized counts of submission success/failure, rate limiting, Turnstile rejection, invalid upload, moderation backlog, repository failures, and Storage errors without recording submission content or PII.
- Roll back public reads to Google and disable the submission endpoint through configuration if abuse, data mismatch, or availability issues occur. Supabase records remain intact for diagnosis.
- No vulnerability is currently being disclosed; this record documents preventive controls for a new public attack surface. Any material finding during implementation will receive a dedicated sanitized security record before release.

### Residual risk

- CAPTCHA and rate limiting reduce but do not eliminate spam or human abuse.
- Client-side normalization is not a security boundary; server-side verification remains mandatory.
- A compromised service-role secret can bypass RLS and affect links and events, so it must remain server-only and be rotated if exposure is suspected.
- The existing shared administrator passcode is weaker than individual administrator identity and MFA; replacing it is deferred and should be revisited if the number of administrators or sensitivity grows.
- Publicly approved images can be saved and redistributed by visitors.

## Risks and Rollback

- **Data loss or mismatch:** keep Google unchanged through parity verification; use idempotent import and compare stable identifiers before cutover.
- **Submission abuse:** launch fail closed with anti-automation and rate controls; provide a configuration switch to disable submissions independently of public reads.
- **Broken image delivery:** preserve fallback artwork and keep Google rollback until approved Supabase images are verified.
- **Admin regression:** isolate event moderation under the existing authenticated path and verify links management unchanged.
- **Supabase outage:** render a clear temporary event-loading state or last safely cached approved response; never expose pending data as a fallback.
- **Rollback:** disable submissions, restore Google reads/image proxy, and deploy the previous revision. Schema changes are additive and need not be destructively reversed during the rollback window.

## Acceptance Criteria

- Visitors can submit valid event details and an optional image from supported mobile and desktop browsers without an account.
- Invalid, abusive, duplicate, oversized, or unsupported submissions fail safely with useful non-sensitive feedback.
- Every new event is pending by default and invisible publicly until explicit administrator approval.
- The administrator can review, approve, reject, edit, cancel/postpone, and delete events without affecting links management.
- Only approved events and approved images are publicly readable; moderation fields never leave the admin/server boundary.
- Approved Supabase events preserve current cards, modal, date/time, image, RSVP, maps, share, past-event, and Google Calendar behavior.
- Current Google events and images are imported with verified parity before read cutover.
- Production can disable submissions or return to Google reads without deleting Supabase data.
- Google runtime access is removed only after the rollback window and explicit approval.
- Lint, type checks, production build, migration checks, focused security/integration tests, and relevant dependency audits pass.

## Verification Plan

- Add focused automated tests for event validation, date normalization, URL handling, public mapping, rate-limit decisions, upload-finalization rules, and moderation transitions using the repository's lightest viable test approach; adding test tooling requires approval if no existing dependency can support it.
- Apply migrations in a controlled environment and inspect grants, RLS policies, bucket settings, and RPC execution privileges.
- Exercise public form success/error/loading states, keyboard/focus behavior, mobile sheet and desktop dialog layouts, image preview/normalization, duplicate prevention, and retry behavior.
- Exercise administrator login, CSRF, same-origin, approval/rejection/edit/delete, moderation privacy, and links-management regression.
- Verify current Google-to-Supabase record/image parity and the source rollback switch.
- Inspect public HTML, RSC payloads, API responses, client bundles, logs, and cache behavior for secrets or private fields.
- Run `npm run lint`, `npx tsc --noEmit`, `npm run build -- --webpack`, `npm audit --omit=dev`, and `npm audit`.
- Review the complete diff and perform authorized browser checks across representative mobile and desktop viewports.

## Actual Changes to Date

- Added an additive Supabase migration for the events table, approval-only public RLS, column-level public grants, private submission tokens, keyed rate-limit state/RPC, and a private size/MIME-restricted `event-images` bucket.
- Replaced the links-only Supabase client module with a shared server-only public/service-role boundary and kept all privileged keys out of client code.
- Added a Supabase event repository that maps approved rows to the existing `CommunityEvent` contract and a configuration-controlled Google/Supabase source switch with an explicit temporary Google rollback option.
- Added a public submission dialog with Eastern date/time fields, inline validation, optional image preview, browser-native metadata-stripping WebP normalization, Turnstile, honeypot, duplicate-submit prevention, and clear pending-review messaging.
- Added a two-step submission API: a same-origin, rate-limited, Turnstile-verified preparation route issues a short-lived single-path upload token; finalization verifies its HMAC/database nonce, event fields, private object path, size, MIME signature, and image alt text before inserting a pending record.
- Added opportunistic cleanup of expired submission tokens and orphan uploads without deleting token records when Storage cleanup fails.
- Added authenticated event moderation under `/links/manage/events`, reusing the existing HTTP-only session, same-origin and CSRF controls. Administrators can edit, approve, reject, cancel/postpone, or delete records; rejection and deletion remove referenced private images.
- Added protected administrator image previews and configuration-aware public image delivery that serves only approved Supabase images after cutover.
- Added a dry-run-by-default CSV/image migration utility with stable legacy identifiers, validation, signature/size checks, idempotent upserts, and content-versioned image paths.
- Updated the empty-calendar copy, security documentation, architectural decision, configuration contract, and verified repository profile.
- Updated `@vercel/oidc` from 4.0.3 to 4.0.7 after explicit approval, removing the high-severity vulnerable Zod dependency from the production tree.
- Applied the additive SQL migration, imported six approved Google-backed events and six images, and retained Google as the temporary rollback source.

## Verification Evidence to Date

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build -- --webpack`: passed after rerunning with network access for the existing Google Fonts build dependency; all new pages and route handlers compiled and generated successfully.
- `git diff --check`: passed.
- `node --check scripts/import-events-csv.mjs`: passed.
- Migration importer dry run: validated a representative published event CSV and performed no remote writes.
- Focused date validation fixture: preserved a December Eastern event as `2026-12-02T00:00:00.000Z` and defaulted an end time without a separate end date to the same Eastern calendar date.
- Focused DST fixture: rejected the nonexistent `2027-03-14 02:30` Eastern local time.
- Local production runtime smoke test: homepage returned HTTP 200, disabled submissions failed closed with HTTP 503 and a generic response, and unauthenticated event administration redirected to the existing login boundary.
- Built client assets contain no references to the service-role key name, submission HMAC/rate-limit secret names, or Turnstile secret name.
- `npm audit --omit=dev`: passed with zero known production vulnerabilities after the approved `@vercel/oidc` 4.0.7 update.
- Full `npm audit`: eight moderate development-only findings remain through the ESLint/minimatch chain; npm's forced remediation changes the matching Next.js ESLint major and was not applied.
- Live Supabase verification: six approved events and six images imported; anonymous reads returned only approved rows; an anonymous insert was denied; the service-role rate-limit RPC succeeded; and the `event-images` bucket remained private with a 5 MB limit.
- Protected Vercel preview `dpl_oLcxNNETYqM75gxyHnpGFprj6eHv` reached `READY`, used the stable `stooopidsocial-preview.vercel.app` alias, rendered the six imported events with all image routes returning HTTP 200, and remained behind Vercel authentication.
- Real Cloudflare Turnstile rendered on the stable preview hostname. The user completed the full image-free submission workflow, observed the success state, confirmed the event appeared only as pending in authenticated moderation, and deleted the test record.

## Checks Not Yet Performed

- The optional image-upload branch was validated structurally and the six migrated images were served privately, but a new public submission containing an image was not created during the final manual preview test.
- Automated cross-browser coverage is not configured; verification used the supported Chrome browser at the available desktop viewport plus the earlier user-reviewed local responsive UI.
- Production has not yet been deployed or smoke-tested. Google runtime credentials remain configured for the rollback window and have not been decommissioned.

## Remaining Gates and Residual Risk

- Commit and push the verified revision, deploy with the already configured production Supabase/Turnstile variables, and repeat public event/image and submission availability smoke checks.
- Keep `EVENTS_GOOGLE_FALLBACK=true` during a short rollback window. Google cleanup remains a separate destructive action requiring explicit approval.
- The phase remains incomplete until production cutover verification and the rollback-window observation are recorded.

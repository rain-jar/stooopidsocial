# Google Sheets and Drive Event Pipeline

- Status: Complete
- Date: 2026-10-22
- Source requirements: Replace the static local event source with a privacy-conscious Google Sheets pipeline. Event images remain in a restricted Google Drive folder and are referenced from the Sheet by file ID.
- Approval: Approved by the user on 2026-10-22, including `google-auth-library`, server-only Google API access, a same-origin image route, and replacement of the homepage's primary event source. Stronger credential handling remains explicitly deferred until after implementation and must be revisited before deployment.

## Objective

Allow authorized editors to publish and update events through Google Sheets without code changes. Keep the Sheet and source Drive files restricted, expose only validated published event data, and serve images for published events through the application without exposing Google credentials or direct Drive URLs.

## Current-State Findings

- The homepage currently imports typed static records from `data/events.ts`.
- Event cards and modal details consume the `CommunityEvent` type directly.
- The application has no API or external data layer and no runtime schema-validation dependency.
- The project uses only Next.js, React, and React DOM at runtime.
- `.env*` files are excluded from Git. The required local variable names are present in `.env.local`; their values were not displayed during discovery.
- Existing dependency/security work, homepage changes, user-provided copy changes, and the untracked `/run` route must be preserved.

## Approved Google Resources

- Spreadsheet ID and range are supplied through server-only environment variables.
- The source tab is `Events`, with data beginning at row 2.
- The Drive folder ID is supplied through a server-only environment variable.
- The service account has Viewer access only to the Sheet and image folder and has no project-level IAM role.
- The Drive folder and Sheet remain `Restricted`; neither will use “Anyone with the link.”

Resource identifiers may be configured locally and in Vercel but will not be duplicated in this tracked record.

## Proposed Data Contract

The pipeline will read the following columns in order:

1. `id`
2. `slug`
3. `name`
4. `description`
5. `start_date`
6. `start_time`
7. `end_date`
8. `end_time`
9. `venue`
10. `address`
11. `drive_file_id`
12. `image_alt`
13. `image_position`
14. `rsvp_url`
15. `status`
16. `published`

The Sheet timezone is Eastern Time. The application will normalize valid rows to the existing `CommunityEvent` interface using `America/Toronto`, including daylight-saving behavior.

## Proposed Approach

### Authentication

- Add Google's official `google-auth-library` runtime dependency.
- Construct credentials only in server-only code from environment variables.
- Request the narrowest practical read-only Sheets and Drive scopes.
- Normalize escaped newlines in the private key in memory.
- Never expose, serialize, log, or return credentials to a client component.

Using the official authentication library avoids maintaining custom JWT signing and token-refresh logic. The alternative is handwritten OAuth assertion code using Node cryptography, which would reduce dependency count but increase security and maintenance risk.

### Event ingestion

- Add a server-only event repository that reads `Events!A2:P` through the Sheets API.
- Validate every row manually without adding a second validation dependency.
- Require unique `id` and `slug`, name, start date/time, venue, valid publication state, and parseable Eastern timestamps.
- Accept optional end time, address, image, RSVP URL, and status only when valid.
- Allow only `http:` and `https:` RSVP URLs.
- Skip unpublished or invalid rows and record sanitized server diagnostics without row content or secrets.
- Sort valid events chronologically and preserve the existing derived past-event behavior.

### Image delivery

- Store only a Drive file ID in the Sheet.
- Add a same-origin server route addressed by event slug rather than raw Drive file ID.
- Resolve the slug through the validated published dataset, then verify the Drive file's metadata, MIME type, size, and parent folder before downloading it.
- Allow a conservative image MIME-type list and reject oversized or non-image files.
- Download authorized bytes server-side with the Drive API and return the correct content type plus bounded cache headers.
- Never redirect the browser to Drive or expose the service-account token.
- Use existing branded fallback artwork when the image is absent, invalid, inaccessible, or unavailable.

Only images attached to `published=TRUE` events will be publicly deliverable. Restricting the Drive source protects the original repository and direct URLs; it cannot prevent a visitor from saving an image that the public website displays.

### Caching and failure behavior

- Cache normalized Sheet results for a short interval so routine page requests do not repeatedly call Google.
- Cache successful immutable image responses longer while allowing a changed Drive file ID to produce a new URL/cache key.
- Keep the current static dataset as an initial operational fallback during rollout.
- If Google is unavailable and no cached data exists, render the local fallback rather than a broken page.
- Do not silently substitute invalid Google rows with invented content.

### Presentation integration

- Preserve the existing event components and `CommunityEvent` contract.
- Change only the server-side source supplied to `EventGrid`.
- Preserve the current cards, modal, copy, query-string behavior, Eastern Time display, and fallback artwork.
- Keep search, filtering, event submission, participation prompts, calendar synchronization, authentication, and dedicated event pages out of scope.

## Affected Areas

- `package.json` and `package-lock.json`: official Google authentication dependency
- `data/events.ts`: retain types and local fallback data, or split types from fallback records if needed
- `lib/`: server-only authentication, validation, normalization, caching, and event access
- `app/api/event-images/[slug]/[version]/route.ts`: controlled, versioned Drive image response
- `app/page.tsx`: await the server-side event repository
- `next.config.ts`: only if required for the same-origin image route; no remote Drive hostname will be allowed
- `.env.local`: remains untracked and user-managed

## Non-Goals

- Making the Sheet or Drive folder public
- Browser-side Google API access
- Uploading or editing Sheet/Drive content from the website
- User authentication or private audience authorization
- Google Calendar synchronization
- A new CMS or administrative interface
- Search, filtering, past-events section, participation prompts, or hero redesign
- Deployment or production-secret configuration
- Workload Identity Federation in this phase; credential hardening will be revisited before deployment

## Security and Privacy Impact

### Assets and trust boundaries

- Sensitive asset: service-account private key in local/Vercel secret storage.
- Private sources: restricted Google Sheet and Drive folder.
- Public outputs: validated fields and images belonging only to rows explicitly marked `published=TRUE`.
- Authentication boundary: server-only Google client; no browser receives Google credentials or source URLs.

### Threats and mitigations

- **Credential disclosure:** keep secrets out of tracked files, client bundles, logs, errors, and documentation; use non-`NEXT_PUBLIC_` variables and server-only modules.
- **Arbitrary Drive-file access/IDOR:** resolve images from published rows and verify each file belongs directly to the configured folder before retrieval.
- **Malicious Sheet content:** validate types, lengths, statuses, URLs, dates, MIME types, and file sizes before rendering or proxying.
- **Stored script injection:** React text escaping remains intact; descriptions are rendered as text, not HTML.
- **Unsafe redirects or links:** permit only HTTP(S) RSVP destinations and retain safe new-tab attributes.
- **Resource exhaustion:** bound Sheet rows, image sizes, fetch timeouts, and cache successful responses.
- **Information leakage in failures:** return generic public errors/fallbacks and sanitized server diagnostics.
- **Unexpected publication:** require an explicit `TRUE` publication value; missing, malformed, or false values fail closed.

### Exposure and user impact

The service account can read only resources explicitly shared with it. If its key is compromised, an attacker could read those resources until access or the key is revoked. If validation or authorization is defective, unpublished event content or unrelated shared files could be exposed. The implementation therefore treats publication and folder membership as mandatory authorization checks.

Images shown on the public site are public outputs even though their Drive originals remain restricted. Editors must not set `published=TRUE` for an event whose image is not approved for public viewing.

### Compatibility and rollout

- No database migration or public API compatibility change is required.
- The existing typed event presentation remains the internal contract.
- Roll out locally with the static fallback enabled, then configure secrets separately in Vercel only after credential-hardening review.
- Monitor sanitized Google API failures, invalid-row counts, and image fallbacks without logging row contents, IDs beyond what is necessary, or credentials.

### Rollback

Restore `app/page.tsx` to import the local event array, remove the server repository and image route, and remove `google-auth-library`. Revoke or delete the service-account key and remove its Sheet/folder access if the integration is abandoned.

### Residual risk

- A long-lived JSON private key remains more sensitive than short-lived federated credentials.
- Publicly rendered images can be downloaded or copied by site visitors.
- Google API availability becomes a dependency, mitigated by caching and the local fallback.
- A public image route can be requested repeatedly, mitigated by validation, size limits, and caching; dedicated rate limiting is not included in this phase.

## Acceptance Criteria

- Only valid rows with `published=TRUE` appear on the homepage.
- Sheet changes appear after the documented cache interval without a code deployment.
- Eastern dates and times, including DST, remain correct.
- Past and cancelled behavior remains consistent with the approved card/modal design.
- Images load without public Drive sharing or direct Drive URLs.
- An image is served only when its event is published and its file belongs to the configured Drive folder.
- Missing, invalid, oversized, wrong-folder, or inaccessible images use fallback artwork.
- Google credentials and private source details never enter client bundles, page markup, logs, or tracked files.
- A Google outage does not break the homepage.
- Existing card, modal, navigation, `/run`, and user-provided copy behavior remain intact.
- No write permission to Google resources is requested or used.

## Verification Plan

- Confirm the service account can read the configured Sheet range and approved Drive folder without displaying credentials.
- Confirm it cannot retrieve a known unshared or wrong-folder file.
- Test valid published, unpublished, invalid, duplicate, missing-image, past, cancelled, and RSVP rows.
- Test valid approved image, wrong-folder image, non-image file, oversized file, missing file, and Google failure behavior.
- Inspect generated client assets and rendered markup for credential or Drive-source leakage.
- Verify cache refresh and static fallback behavior.
- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run the supported production build path.
- Inspect desktop and mobile cards/modal, keyboard behavior, direct modal URLs, and image fallbacks.
- Run the relevant dependency audit after installation and record any residual findings.

## Actual Changes

- Added `google-auth-library` 11.3.1 and server-only read-only authentication for Sheets and Drive.
- Added a cached Sheet repository that reads the approved range, validates up to 500 rows, fails closed on `published`, normalizes Sheet dates/times to `America/Toronto`, rejects unsafe RSVP values, skips duplicate identifiers, and keeps Drive IDs out of public event objects.
- Added a versioned same-origin image route keyed by event slug and a non-reversible file-ID hash. The route verifies publication, version, direct configured-folder membership, file state, MIME type, and an 8 MB size ceiling before returning bytes.
- Added sanitized failure behavior, a five-minute event refresh interval, bounded image caching, and the existing local event dataset as an operational fallback when Google cannot be reached.
- Updated the homepage to use the server repository while preserving the existing grid and modal contract.
- Added postponed-event presentation and disabled RSVP for postponed events.
- Allowed the existing address field to contain either a normal address or a validated direct HTTP(S) map URL.
- Kept `.env.local` untracked; no credential, Drive file ID, direct Drive URL, or Google access token is sent to the client.

## Verification Evidence

- Service-account read-only checks returned HTTP 200 for the configured Sheet and Drive folder without displaying credentials or row contents.
- The live homepage rendered the four published Sheet records, filtered the past record from the upcoming grid, and displayed the three current upcoming records with their restricted Drive images.
- A Sheet-backed modal rendered the correct event text, Eastern date/time, alt text, no-RSVP state, and direct Google Maps link.
- A nonexistent event-image slug returned HTTP 404.
- Rendered homepage markup contained no private-key marker, service-account domain, direct Drive URL, or Google API hostname.
- An intentionally invalid Sheet ID returned a working HTTP 200 homepage containing the local fallback events and a sanitized server diagnostic.
- `npm ci`: passed.
- `npm run lint`: passed without warnings.
- `npx next typegen`: passed.
- `npx tsc --noEmit`: passed after framework-generated route types were refreshed.
- `npm run build -- --webpack`: passed, including TypeScript, static generation, five-minute homepage revalidation, and the dynamic image route.
- `git diff --check`: passed.
- `npm audit --omit=dev`: zero vulnerabilities.

## Checks Not Performed

- The implementation did not modify live Sheet values or Drive permissions to create destructive or intentionally malicious test cases. Invalid-row, duplicate, unpublished, wrong-folder, MIME, and size behavior is enforced by the validated branches but was not exercised against additional live Google records.
- Vercel production environment variables and Workload Identity Federation were not configured because deployment and credential hardening remain outside this implementation phase.

## Residual Risk and Follow-up

- The current JSON service-account key is long-lived. Before deployment, replace it with Vercel OIDC/Google Workload Identity Federation where practical, then disable and delete the JSON key.
- The full development audit reports five high-severity entries through `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. The production audit is clean, the affected chain is lint-time only, and npm's proposed automatic remediation is an incompatible downgrade to `eslint-config-next` 14.2.35. No out-of-scope downgrade or override was applied.
- Publicly rendered event images can be saved by site visitors even though their Google Drive originals remain restricted.
- Google availability is now an operational dependency, mitigated by five-minute caching and the local fallback dataset.

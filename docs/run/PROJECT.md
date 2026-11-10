# Project Blueprint

Run crew page only. This is not a site-wide blueprint.

## 1. Problem and Evidence

- Product / problem: The public `/run` route was a stub. The crew needs one page for Stooopid Sunday, the pacing app, and photos.
- Primary users and current workflow: People who already use the Linktree and the crew pacing app at `https://anyonecanpacebeta.pages.dev/`.
- Alternatives and demand evidence: The pacing app and Instagram (`@stooopidcrew`) already exist. This page points at them. It does not replace them.
- Desired outcome / success metric, baseline, target, measurement: A visitor can open `/run` from the header or Linktree and read Sunday details, FAQs, the pacing link, and photos. No numeric target yet. Measurement is deferred (no analytics in this slice).

## 2. Vision and Current Scope

- Long-term vision and possible capabilities (not commitments): A crew home for the weekly run, with real photos, a live Instagram feed, a race tracker, and admin-edited copy.
- Current milestone and why it matters: Run crew page v1. It gives the route a crew-styled page and a swappable content file without new services.
- MVP capabilities / prioritized work: Header and Linktree links to `/run`. Five sections (duck hero, Stooopid Sunday, FAQs, pacing app, Rolodex photos). Duck animation. Placeholder copy and photos in `data/run.ts`.
- Non-goals: Instagram embeds or the Instagram Graph API, race tracker, analytics, admin editing, real copy and photos, merging to `main`, production deploy.
- Acceptance criteria: See `docs/work/010-run-crew-page.md`.
- Budget / timeline / owner / dependencies: Owner is Raj. No new paid dependency. External pages: the pacing app and Instagram.
- Expected traffic, data volume, latency, uptime, and operating cost: Same as the existing site. The page is static. No new data store.

## 3. Experience

- Core user journeys: Open Run from the header or `/links`. Read Sunday details. Open this week's details or the pacing app. Expand an FAQ. Flip photos. Follow `@stooopidcrew`.
- Designs / prototype / content sources: Crew palette already used on `/links`. Pacing-app reference for graph paper, stroke, radius, and press-shadow treatment only. No copied illustrations. Duck frames supplied by Raj. Copy beyond the approved facts is marked `[Placeholder]`.
- Devices, browsers, accessibility, and relevant UI states: Mobile-first, checked at 375px and desktop. Keyboard, visible focus, reduced motion, gallery loading, empty/error card.
- User feedback findings: None yet.

## 4. System and Constraints

- Approved stack, package manager, rendering, component boundaries: Existing Next.js 16 app, npm, Tailwind v4 tokens in `app/globals.css`, `next/font`. No new dependencies. Content in `data/run.ts`. Page UI in `app/run` and `components/run`.
- Data model / API contracts / integrations: Local TypeScript data only. Links out to the pacing app and Instagram. No API.
- Authentication, permissions, privacy, retention, data sensitivity: Public page. No accounts, forms, or stored visitor data.
- Hosting, environments, observability, recovery: Same Vercel project. Preview from the PR branch is expected. Production deploy is a separate approval.
- Constraints and significant technical risks: Duck frames must keep `run-a` and `run-b` the same pixel size. The mascot must stay out of the text column on a 375px phone.

## 5. Decisions and Assumptions

| ID | Decision or assumption | State and approval reference | Rationale / future fit | Switching cost | Revisit trigger |
| --- | --- | --- | --- | --- | --- |
| D1 | Rolodex gallery instead of Instagram embeds | Approved 2026-11-10 (America/Toronto), amendment in chat | No third-party script. Files in `public/run/photos` are swappable. | Replace the gallery component. Data file shape can stay. | Raj wants a live feed. |
| D2 | Put the Run link back in the shared header | Approved 2026-11-10. Reverses that part of work record 009. | The page needs a way in from the rest of the site. | Remove the link. | Header IA changes again. |
| D3 | Page-specific header, footer, and JetBrains Mono | Approved with the proposal | The run page should not use the dark site chrome. | Delete `app/run/layout.tsx` and the run header/footer. | A shared crew chrome is designed. |
| D4 | Sunday time is shown without a timezone | Assumption | The approval said "every Sunday 10 AM" and did not name a zone. | Add a zone label in `data/run.ts`. | Raj confirms the zone. |
| D5 | FAQ and photo captions are placeholders | Approved | Real copy and photos were not supplied. | Edit `data/run.ts` and replace files in `public/run/photos`. | Crew sends the real text and images. |

## 6. Validation, Launch, and Operations

- Acceptance / security / performance / accessibility verification strategy: Lint, `tsc`, production build, and browser checks at phone and desktop widths, including keyboard, reduced motion, and gallery loading/error. Recorded in work record 010.
- Launch, migration, onboarding, support ownership: Not launched. Raj approves merge and production separately.
- Alerts, backups, restore verification, rollback and incident response: Rollback is reverting the PR. No migration.
- Product measurement, maintenance, feedback and retirement: Not in this slice. Copy and photos are maintained by editing the data file and the public image folders.

## 7. Open Questions and Deferred Work

| Question / deferred item | Why deferred | Owner | Evidence or trigger needed |
| --- | --- | --- | --- |
| Live Instagram Graph API feed | Account is a Business account, but v1 must not add third-party scripts or API credentials. | Raj | Explicit approval and a server-side token plan. |
| Race tracker | Not in the approved v1 scope. | Raj | A separate proposal. |
| Analytics | Not approved. Would be a new data collection decision. | Raj | A measurement plan. |
| Admin editing | Content is a file edit for now. | Raj | The crew needs non-developers to edit it. |
| Real copy and photos | Not supplied. | Raj | Final text and image files. |
| Timezone on Sunday | Not specified. | Raj | Confirm the zone to print. |

# Project Status

- Last updated: 2026-11-10
- Repository branch / commit / uncommitted changes: `cursor/run-crew-page-v1-ea82`. Commit SHA is the tip of that branch after this record lands. Not merged. No production deploy.
- Current milestone: Run crew page v1 implemented on the branch. Awaiting Raj's review. Merge and production deploy are not approved.
- Active work record / approved scope: `docs/work/010-run-crew-page.md`. Approved 2026-11-10 (America/Toronto), including the Rolodex amendment.
- Next action: Raj reviews the PR and the Vercel preview. Do not merge or deploy to production without a separate approval.

## Stage Coverage

| Stage | Status | Output / evidence / revisit trigger |
| --- | --- | --- |
| 1. Define the problem | Covered for current milestone | `/run` was a stub. Scope is the crew page, not the whole site. |
| 2. Scope the product | Covered for current milestone | Approved v1 scope and deferred list are in `docs/run/PROJECT.md` and work record 010. |
| 3. Design the experience | Covered for current milestone | Crew palette, graph paper, press buttons, duck sequence, Rolodex. Placeholder copy is marked. |
| 4. Plan the system | Covered for current milestone | Static page, `data/run.ts`, no new dependency or service. |
| 5. Build | Covered for current milestone | Branch contains the page, assets, header link, and Linktree link. |
| 6. Validate | Covered for current milestone | Lint, typecheck, production build, and browser checks recorded in work record 010. |
| 7. Launch | Not started | Needs Raj's approval to merge and to deploy production. |
| 8. Operate and improve | Deferred | Real copy, photos, Instagram feed, race tracker, analytics, admin editing. |

## Current Reality

- Implemented: `/run` with its own header and footer, five sections, duck sequence, Rolodex, placeholder content, and Run links in the shared header and on `/links`.
- Verified: Lint, `tsc --noEmit`, `npm run build`, and browser checks at 375px and desktop, including reduced motion, keyboard, drag, loading text, and the photo error card. Evidence is in work record 010.
- Checks not run / uncertainty: Not checked in Safari or Firefox on a physical phone. Vercel preview URL is reported on the PR when the deployment exists. No analytics check, because analytics is out of scope.
- Blockers / decisions needed: Merge and production deploy. Real copy, photos, and whether Sunday should name a timezone.
- Next slice / approval needed: Raj's review. Anything in the deferred list needs its own approval.

## Handoff

The branch is ready for review. The page does not use the dark site header. Work record 009 removed Run from the header; this slice puts that link back, on purpose. Placeholder strings start with `[Placeholder]`. Photos are `public/run/photos/01.webp` through `06.webp`. Duck frames are `public/run/duck/`. `run-a.webp` and `run-b.webp` are a matched pair. Do not merge to `main` or deploy production from this work alone.

# Project Status

- Last updated: 2026-11-11
- Repository branch / commit / uncommitted changes: `cursor/run-crew-page-v1-ea82`. The 8:37 PM phone peek and Rolodex follow-up is on this branch. Not merged. No production deploy.
- Current milestone: Run crew page v1. Desktop stays as approved. Phones have the 7:32 PM and 8:37 PM America/Toronto amendments. Merge and production deploy are not approved.
- Active work record / approved scope: `docs/work/010-run-crew-page.md`.
- Next action: Raj reviews the updated preview (`https://stooopidsocial-git-cursor-run-crew-pa-7113dc-raj-nairs-projects.vercel.app`, behind Vercel SSO). Do not merge or deploy to production without a separate approval.

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

- Implemented: phone peek uses a pole-free asset and is cut only by the screen edge. Phone Rolodex has dots, hidden previous/next controls, tap and swipe. Desktop layout is unchanged.
- Verified: Lint, `tsc --noEmit`, `npm run build`, and browser checks at 375px, 390px, and 1280px, plus a phone recording of tap and swipe.
- Checks not run / uncertainty: Not checked in Safari or Firefox on a physical phone. Vercel preview URL is reported on the PR when the deployment exists. No analytics check, because analytics is out of scope.
- Blockers / decisions needed: Merge and production deploy. Real copy, photos, and whether Sunday should name a timezone.
- Next slice / approval needed: Raj's review. Anything in the deferred list needs its own approval.

## Handoff

Desktop is the approved wide layout and was not changed by the phone follow-up. Phones under 768px collapse the hero after the hold, keep the duck on screen in gaps, and use a full-width column. Placeholder strings start with `[Placeholder]`. Do not merge to `main` or deploy production from this work alone.

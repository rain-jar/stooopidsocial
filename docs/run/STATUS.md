# Project Status

- Last updated: 2026-11-25
- Repository branch / commit / uncommitted changes: `fix/run-duck-peek-on-return`. Peek-only return to the top, plus the phone queue and off-screen peek fixes. Not merged. No production deploy of this follow-up.
- Current milestone: After the intro run-off, the `/run` duck peeks at the hero title when the visitor is back at the top. The hero stays collapsed. Production already serves the earlier `/run` page from `main`.
- Active work record / approved scope: `docs/work/014-run-duck-peek-on-return.md`. Earlier `/run` v1 scope remains in `docs/work/010-run-crew-page.md`.
- Next action: Raj reviews the pull request and preview. Do not merge or deploy to production without a separate approval.

## Stage Coverage

| Stage | Status | Output / evidence / revisit trigger |
| --- | --- | --- |
| 1. Define the problem | Covered for current milestone | Scrolling back to the top sometimes left the duck off-center or off-screen, and could leave a blank hero stage on desktop. |
| 2. Scope the product | Covered for current milestone | Approved Option B: peek at the hero title, keep the hero collapsed, fix phone queueing and stale peeks. |
| 3. Design the experience | Covered for current milestone | Intro is one-time. Later visits to the top use the same side peek as other headings. |
| 4. Plan the system | Covered for current milestone | Changes stay in `RunDuck.tsx` and these docs. No new dependency. |
| 5. Build | Covered for current milestone | Branch contains the motion change and work record. |
| 6. Validate | Covered for current milestone | Lint, typecheck, production build, and Playwright checks are recorded in work record 014. |
| 7. Launch | Not started for this follow-up | Needs Raj's approval to merge and to deploy production. The original `/run` v1 is already live. |
| 8. Operate and improve | Deferred | Real copy, Instagram feed, race tracker, analytics, admin editing. |

## Current Reality

- Implemented: After the intro, `run-departed` stays on. At the top, the duck peeks at the hero title. Phone animations queue the latest destination. Scroll-driven peeks stay on the visible section. A scroll during the intro hold collapses the hero immediately.
- Verified: Lint, `tsc --noEmit`, `npm run build`, and Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800. Details are in work record 014.
- Checks not run / uncertainty: Not checked on a physical iPhone until Raj reviews a preview or a local build on a phone.
- Blockers / decisions needed: Merge and production deploy of this follow-up.
- Next slice / approval needed: Raj's review of the pull request. Anything in the deferred list needs its own approval.

## Handoff

The intro run-off is unchanged unless the visitor scrolls during the hold, in which case the page goes straight to the departed state. After that, the hero does not reopen. Reduced motion stays a static duck. PR #2 remains revertable with `git revert 74c68a8d`. Do not merge to `main` or deploy production from this work alone.

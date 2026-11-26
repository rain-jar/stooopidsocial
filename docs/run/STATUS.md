# Project Status

- Last updated: 2026-11-26
- Repository branch / commit / uncommitted changes: `feat/run-crew-links-home-cta`. The Crew links paper on `/run` has a footer under Community: a hand-drawn divider and a full-width "Visit Les Stooopids →" link to `/`. Not merged. No production deploy.
- Current milestone: Send people from the Crew links popup to the homepage without a full page reload, and without leaving the popup on screen.
- Active work record / approved scope: `docs/work/017-run-crew-links-home-cta.md`. The popup sizing and close-state fix in `docs/work/016-run-crew-links-popup.md` are on `main` as `651b7aa`. Earlier `/run` v1 scope remains in `docs/work/010-run-crew-page.md`.
- Next action: Raj reviews the pull request and preview. Do not merge or deploy to production without a separate approval.

## Stage Coverage

| Stage | Status | Output / evidence / revisit trigger |
| --- | --- | --- |
| 1. Define the problem | Covered for current milestone | The Crew links popup listed the notes and then stopped. There was no way home from the bottom of the paper. |
| 2. Scope the product | Covered for current milestone | Approved: a footer under Community, a thin hand-drawn divider, and one full-width "Visit Les Stooopids →" button to `/` via Next.js `<Link>`, closing the popover on the way. |
| 3. Design the experience | Covered for current milestone | The button uses the press shape of "This week's details" as a navy outline on the cream paper. On a short screen the notes scroll and the footer stays at the bottom of the sheet. |
| 4. Plan the system | Covered for current milestone | The label lives in `data/run.ts`. The link is a client component. Layout is in `app/globals.css`. No new dependency. `display: flex` stays only on the open popover. |
| 5. Build | Covered for current milestone | Branch contains the data, component, CSS, and work record. |
| 6. Validate | Covered for current milestone | Lint, typecheck, production build, and Playwright checks are recorded in work record 017. |
| 7. Launch | Not started for this follow-up | Needs Raj's approval to merge and to deploy production. |
| 8. Operate and improve | Deferred | Real copy, Instagram feed, race tracker, analytics, admin editing. |

## Current Reality

- Implemented: The Crew links popup footer is a divider plus "Visit Les Stooopids →", rendered as `<Link href="/">`. Clicking it closes the popover and navigates to `/` on the client. Section tags, heading levels, and the closed-on-load behavior are unchanged.
- Verified: Lint, typecheck, production build, and Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800 (114/114) passed, recorded in work record 017.
- Checks not run / uncertainty: Not checked on a physical iPhone until Raj reviews a preview or a local build on a phone.
- Blockers / decisions needed: Merge and production deploy of this follow-up. The 375 collapsed sheet is 347×490 so Community stays visible above the footer; the previous sheet at that width was 347×416.
- Next slice / approval needed: Raj's review of the pull request. Anything in the deferred list needs its own approval.

## Handoff

The popup still uses the native popover, the same close and deep-link behavior, and `/run?crew-links=1`. `display: flex` is only on `.run-notes-popover:popover-open`. PR #2 remains revertable with `git revert 74c68a8d`. Do not merge to `main` or deploy production from this work alone. Do not upgrade Next.js in this branch.

# Project Status

- Last updated: 2026-11-25
- Repository branch / commit / uncommitted changes: `fix/run-crew-links-popup`. The Crew links paper popup is sized to the text column on desktop, with a taller sheet and a stronger backdrop. Not merged. No production deploy of this follow-up.
- Current milestone: Size the Crew links popup so the page behind it stops pulling focus, using design judgment rather than a fixed percentage.
- Active work record / approved scope: `docs/work/016-run-crew-links-popup.md`. The gliding-duck work in `docs/work/015-run-duck-glide.md` is merged to `main` as `e35746f`. Earlier `/run` v1 scope remains in `docs/work/010-run-crew-page.md`.
- Next action: Raj reviews the pull request and preview. Do not merge or deploy to production without a separate approval.

## Stage Coverage

| Stage | Status | Output / evidence / revisit trigger |
| --- | --- | --- |
| 1. Define the problem | Covered for current milestone | The Crew links popup felt too small, and the page text behind it was distracting, especially on desktop. |
| 2. Scope the product | Covered for current milestone | Approved: taller sheet, desktop width matching the text column, best design judgment instead of a fixed 20–30% increase. |
| 3. Design the experience | Covered for current milestone | The sheet covers the text column. A mid-strength navy backdrop with a light blur sends the page behind it out of focus. |
| 4. Plan the system | Covered for current milestone | Changes stay in `app/globals.css` and these docs. No new dependency. |
| 5. Build | Covered for current milestone | Branch contains the CSS change and work record. |
| 6. Validate | Covered for current milestone | Lint, typecheck, production build, and Playwright checks are recorded in work record 016. |
| 7. Launch | Not started for this follow-up | Needs Raj's approval to merge and to deploy production. The `/run` page from `e35746f` is already live. |
| 8. Operate and improve | Deferred | Real copy, Instagram feed, race tracker, analytics, admin editing. |

## Current Reality

- Implemented: The Crew links popup width matches the `.run-copy` column on desktop. The sheet has a viewport-aware minimum height (26–32rem on phones, 36rem on desktop) and more padding. The backdrop is 48% navy with a 6px blur.
- Verified: Lint, `tsc --noEmit`, `npm run build`, and Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800. Details are in work record 016.
- Checks not run / uncertainty: Not checked on a physical iPhone until Raj reviews a preview or a local build on a phone.
- Blockers / decisions needed: Merge and production deploy of this follow-up.
- Next slice / approval needed: Raj's review of the pull request. Anything in the deferred list needs its own approval.

## Handoff

The popup still uses the native popover, the same sticky notes, and the `/run?crew-links=1` deep link. PR #2 remains revertable with `git revert 74c68a8d`. Do not merge to `main` or deploy production from this work alone.

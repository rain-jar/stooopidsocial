# Project Status

- Last updated: 2026-11-25
- Repository branch / commit / uncommitted changes: `feat/run-duck-glide`. After the intro run-off, the `/run` duck glides between headings with a one-shot arrival bob. Not merged. No production deploy of this follow-up.
- Current milestone: Replace the post-intro section-to-section sprint with a calm scroll-tied glide, keeping the intro run-off, tap-to-hop, the PR #4 top-of-page peek, and a static peek for reduced motion.
- Active work record / approved scope: `docs/work/015-run-duck-glide.md`. The peek-on-return work in `docs/work/014-run-duck-peek-on-return.md` is merged to `main` as `7bdc2e05`. Earlier `/run` v1 scope remains in `docs/work/010-run-crew-page.md`.
- Next action: Raj reviews the pull request and preview. Do not merge or deploy to production without a separate approval.

## Stage Coverage

| Stage | Status | Output / evidence / revisit trigger |
| --- | --- | --- |
| 1. Define the problem | Covered for current milestone | The sprint between sections after the intro pulled attention away from the copy. |
| 2. Scope the product | Covered for current milestone | Approved: keep the intro run-off, glide after that, bob once per arrival, keep tap-to-hop, static peek for reduced motion, preserve PR #4 top-of-page behavior. |
| 3. Design the experience | Covered for current milestone | Intro is the one big moment. After that the peeking duck is a lagging companion in the left margin. |
| 4. Plan the system | Covered for current milestone | Changes stay in `RunDuck.tsx`, `app/globals.css`, and these docs. No new dependency. |
| 5. Build | Covered for current milestone | Branch contains the motion change and work record. |
| 6. Validate | Covered for current milestone | Lint, typecheck, production build, and Playwright checks are recorded in work record 015. |
| 7. Launch | Not started for this follow-up | Needs Raj's approval to merge and to deploy production. The `/run` page from `7bdc2e05` is already live. |
| 8. Operate and improve | Deferred | Real copy, Instagram feed, race tracker, analytics, admin editing. |

## Current Reality

- Implemented: After the intro, section changes use a rAF lerp toward the current heading peek. Arrival plays a one-shot head-bob. Tap-to-hop is unchanged on phones. Reduced motion is a static peek. The hero stays collapsed after the intro, and a later return to the top peeks at the hero title.
- Verified: Lint, `tsc --noEmit`, `npm run build`, and Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800. Details are in work record 015.
- Checks not run / uncertainty: Not checked on a physical iPhone until Raj reviews a preview or a local build on a phone.
- Blockers / decisions needed: Merge and production deploy of this follow-up.
- Next slice / approval needed: Raj's review of the pull request. Anything in the deferred list needs its own approval.

## Handoff

The intro run-off is unchanged unless the visitor scrolls during the hold or the page loads already scrolled, in which case the page goes straight to the departed glide. After that, the hero does not reopen. Reduced motion is a static peek. PR #2 remains revertable with `git revert 74c68a8d`. Do not merge to `main` or deploy production from this work alone.

# 014 — Run duck peeks on return to the top

- Status: In progress
- Proposal depth and reason: Standard — a motion bug on the live `/run` page, with phone and desktop behavior changes in the existing duck state machine.
- Source requirements / milestone: After the intro run-off, scrolling back to the top sometimes left the duck off-center or off-screen and, on desktop, could reopen an empty hero stage.

## Proposal (all depths)

- Outcome, scope and non-goals: After the intro run-off, the hero stays collapsed for the rest of the visit. When the visitor is back at the top, the duck peeks at the hero title the same way it peeks at other headings. There is no return to the starting-blocks pose and no hero-stage re-expansion. Non-goals: a new animation library, palette or copy changes, merge to `main`, and production deploy.
- Recommended approach and why: Keep `run-departed` once it is applied. Trigger the top-of-page peek from scroll position (at or below 80px), not from which section has the highest intersection ratio. On phones, queue the latest `runTo` destination while an animation is running, and never peek a section that is off-screen. If the visitor scrolls during the intro hold, apply the departed state immediately so the hero does not leave a gap. This is smaller and safer than replaying the intro on every return to the top.
- Future fit, tradeoff and reversal effort: The intro remains a one-time welcome. Visitors who scroll back up no longer see the centered starting blocks. Reversal is a revert of this branch or its merge commit; it does not rewrite history and does not affect the PR #2 revert point (`74c68a8d`).
- Acceptance criteria and verification: After the intro, `run-departed` stays on for the rest of the visit. At the top, the duck is visible and peeking at the hero title, Sunday stays up, and the hero stage does not reopen. The duck is never parked off-screen. Scrolling during the intro hold collapses the hero without a blank gap. Forward section changes still run and peek as before. Reduced motion stays a static duck. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass. Playwright checks Chromium and WebKit at 390×844, 375×667, and 1280×800, including slow and fast return, scroll during the intro, mid-page reload then jump to the top, and the normal forward flow.

## Additional Analysis (Standard / Full)

- Current findings / affected components and interfaces: `components/run/RunDuck.tsx` is the state machine. Phone `runToPhone` had no return-to-hero path and dropped in-flight destinations. `onScroll` peeked the stale `currentIndex` even when that section was off-screen. Desktop `runToDesktop` removed `run-departed` and reopened the stage, and the IntersectionObserver often never called `runTo(0)` because the collapsed Sunday section still had a high intersection ratio.
- Alternatives and dependencies: Option A would have expanded the hero and run the duck back to the starting blocks. Raj preferred Option B (peek-only). No new packages.
- Risks, costs and deferred work: Peek position beside the collapsed hero title needs visual checks at phone and desktop widths. Physical iPhone testing is still outstanding. Deferred: any later request to restore a return-to-center intro replay.
- Revisit triggers: Raj asks for the centered starting-blocks return, or a visual issue with the hero-title peek.

## Security Impact

- No new third-party scripts, embeds, pixels, or analytics.
- No secrets, tokens, or environment variables.
- No forms, accounts, or visitor data collection. The change is client-side motion only.

## Approval

- User approval / date / proposal revision or scope: Raj approved Option B (peek-only return, plus the two phone fixes) on 2026-11-25 at about 3:12 PM America/Toronto, then asked to build it.
- Conditions and separately authorized external actions: A new branch, commits, and a pull request to `main` are authorized. Merge, push to `main`, and production deploy are not authorized.
- Material amendments / renewed approval: None. The approved scope is peek-only after the intro, queueing phone `runTo` destinations, not peeking a stale off-screen section, collapsing immediately if the visitor scrolls during the intro hold, and leaving reduced motion as a static duck.

## Results (after implementation)

- Actual changes and files:
  - `components/run/RunDuck.tsx` — after the intro, `run-departed` is never removed except on unmount or reduced motion. Returning to the top peeks at the hero title. Phone `runTo` queues the latest destination. `onScroll` follows the on-screen section and will not park the duck off-screen. A scroll during the intro hold applies the departed state immediately.
  - `docs/run/STATUS.md` — current status for this follow-up.
  - `docs/work/014-run-duck-peek-on-return.md` — this record.
- Verification: `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed on 2026-11-25 (America/Toronto). The first `next build` stopped to show a Next.js 16.4.2 security upgrade reminder; a retry of the same command completed successfully and prerendered `/run`. Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800 all passed the acceptance checks: after the intro the hero stays collapsed, a return to the top peeks at the hero title with Sunday still up, a scroll during the intro hold collapses the hero without a blank gap, mid-page reload then jump to the top settles on the hero-title peek, forward section changes still run and peek, and reduced motion stays a static duck. On desktop, a fast jump can leave the duck briefly mid-run below the fold for about a second; the stage stays collapsed and the duck peeks at the hero title once the run finishes. Not tested on a physical iPhone.
- Remaining follow-ups: Merge and production deploy need a separate approval. PR #2 remains revertable with `git revert 74c68a8d`.

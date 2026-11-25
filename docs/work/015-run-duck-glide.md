# 015 — Run duck glides between sections

- Status: In progress
- Proposal depth and reason: Standard — a motion change on the live `/run` page that replaces the post-intro section sprint with a calmer scroll-tied glide.
- Source requirements / milestone: After the intro run-off, the sprint from one heading to the next felt distracting. Keep the intro as the one big moment, then let the peeking duck glide along the left margin.

## Proposal (all depths)

- Outcome, scope and non-goals: Keep the starting-blocks run-off as the one welcome animation. After that, on phone and desktop, the peeking duck glides down and up the left margin with the scroll, using an eased lag. When it settles at a heading, it sits in the same peek position as today and does a small head-bob once per arrival. Tap-to-hop stays. Reduced motion is a static peek with no glide and no bob. The PR #4 return-to-top behavior stays: the hero remains collapsed, the duck peeks at the hero title at the top, there is no blank gap, and the duck never goes off-screen. Non-goals: a new animation library, palette or copy changes, merge to `main`, and production deploy.
- Recommended approach and why: Drive the post-intro position with a `requestAnimationFrame` lerp (frame-rate independent exponential smoothing) toward the current heading's peek point, writing only `transform` and `width` on the mover. A CSS `translateY` on the sprite is the one-shot arrival bob. This removes the section-to-section sprint, the in-flight destination queue, and the heading IntersectionObservers. No animation libraries, and no layout reads inside a layout-write loop beyond measuring the peek target.
- Future fit, tradeoff and reversal effort: The duck becomes a calm companion after the intro instead of a performer at every section change. Desktop peeks now stay in the viewport on long sections, same as phones already did, instead of sitting at a fixed `offsetTop` that can scroll away. Reversal is a revert of this branch or its merge commit; it does not rewrite history and does not affect the PR #2 revert point (`74c68a8d`).
- Acceptance criteria and verification: After the intro, section changes are a glide, not a sprint. The peek position at a settled heading matches the current phone peek-mobile and desktop side-peek visuals. The head-bob fires once per arrival, not while staying in the same section. Tap-to-hop still works on phones after the intro. Reduced motion shows a static peek and no glide, bob, or hop. Returning to the top peeks at the hero title, the hero stays collapsed, and the duck never leaves the screen. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass. Playwright checks Chromium and WebKit at 390×844, 375×667, and 1280×800, including slow and fast scroll, transform sampling for jitter and overshoot, bob-once-per-heading, tap-to-hop, scroll during the intro, mid-page reload, reduced motion, and the top-of-page peek.

## Additional Analysis (Standard / Full)

- Current findings / affected components and interfaces: `components/run/RunDuck.tsx` owned the sprint (`sprintPhone`, `runToDesktop`, `runToPhone`) and the observer-driven `runTo` queue. `app/globals.css` already had drop, run-bob, and hop keyframes. After PR #4 (`7bdc2e05`), returning to the top peeked at the hero title and the hero stayed collapsed.
- Alternatives and dependencies: A CSS `transition: transform` on each heading change would also be library-free, but a rAF lerp stays tied to scroll while a heading is moving and is less likely to feel jumpy. No new packages.
- Risks, costs and deferred work: The post-intro Sunday peek still happens at `scrollTop` 0; the hero-title peek is reserved for a later return to the top, matching PR #4. Physical iPhone testing is still outstanding. Deferred: any later request to restore a section sprint, or to add hop on desktop.
- Revisit triggers: Raj finds the lag too slow or too tight, the bob too large or too frequent, or a peek that covers text or tap targets.

## Security Impact

- No new third-party scripts, embeds, pixels, or analytics.
- No secrets, tokens, or environment variables.
- No forms, accounts, or visitor data collection. The change is client-side motion only.

## Approval

- User approval / date / proposal revision or scope: Raj approved the glide, the arrival head-bob, and keeping tap-to-hop on 2026-11-25 at about 4:51 PM America/Toronto, then asked to build it.
- Conditions and separately authorized external actions: A new branch, commits, and a pull request to `main` are authorized. Merge, push to `main`, and production deploy are not authorized.
- Material amendments / renewed approval: None yet.

## Results (after implementation)

- Actual changes and files:
  - `components/run/RunDuck.tsx` — the intro run-off is unchanged. After that, a `requestAnimationFrame` lerp follows the current heading peek (phone peek-mobile, desktop side peek). Arrival plays a one-shot CSS head-bob. Tap-to-hop is unchanged on phones. Section sprints, the in-flight destination queue, and the heading IntersectionObservers are gone. If the page loads already scrolled, or scroll is restored shortly after load, the intro is skipped and the duck peeks at the current section. Reduced motion is a static peek that snaps to the current heading with no glide, bob, or hop.
  - `app/globals.css` — adds the arrival-bob keyframe. Under reduced motion the mover can show as a static peek, and hero collapse transitions are disabled.
  - `docs/run/STATUS.md` and `docs/work/015-run-duck-glide.md` — this record.
- Verification: `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed on 2026-11-25 (America/Toronto). The first `next build` stopped to show a Next.js 16.4.2 security upgrade reminder; a retry of the same command completed successfully and prerendered `/run`. Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800 all passed: after the intro the duck glides rather than sprints; transform samples showed no overshoot and no settle jitter; the arrival bob fired once per heading change (typical counts `1,0,1,1,1`, with Sunday already settled after the intro); tap-to-hop worked on phones; a scroll during the intro hold collapsed the hero without a blank gap; a mid-page reload peeked at the current section, then a return to the top peeked at the hero title; reduced motion stayed a static on-screen peek with no bob or hop. Screenshots and a Chromium 390 scroll-through video are in `/workspace/run-glide/`. Not tested on a physical iPhone.
- Remaining follow-ups: Merge and production deploy need a separate approval. PR #2 remains revertable with `git revert 74c68a8d`. Next.js still recommends a security upgrade; that is out of scope for this PR.

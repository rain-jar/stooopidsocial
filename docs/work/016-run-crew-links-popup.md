# 016 — Crew links popup sizing

- Status: In progress
- Proposal depth and reason: Standard — a visual sizing change to the Crew links paper popup on `/run`, so the page behind it stops competing for attention.
- Source requirements / milestone: The popup looked good but felt too small, especially on desktop. The text behind it was distracting. Raj asked for a taller sheet, and on the web a width that matches the page's text column. The 20–30% taller figure was an estimate; he asked for best design judgment rather than an exact percentage.

## Proposal (all depths)

- Outcome, scope and non-goals: Size the Crew links paper popup so it sits over the text column, feels like a substantial sheet, and leaves the page behind dimmed and out of focus. Non-goals: new links or copy, a new modal library, changing the sticky-note layout, merge to `main`, and production deploy.
- Recommended approach and why: Do not add a literal 25% to the current fit-content height. A slightly taller version of the current 24rem card would still look small once the desktop width grew, and a 22% navy backdrop would still leave readable Sunday and FAQ copy around it. Instead, match the popup width to the `.run-copy` column on desktop, give the sheet a viewport-aware minimum height with more paper padding, and raise the backdrop to about 48% navy with a 6px blur. The notes stay at the top of the sheet; the extra height reads as a paper margin.
- Future fit, tradeoff and reversal effort: The popup becomes a clearer focus for the links, at the cost of covering more of the page while it is open. Reversal is a revert of this branch or its merge commit. It does not rewrite history and does not affect the PR #2 revert point (`74c68a8d`).
- Acceptance criteria and verification: On desktop, the popup is as wide as the text column (34rem from 800px, 40rem from 1100px). On phone and desktop, the sheet is tall enough to hold the center of the screen, body text behind it is dimmed and blurred, and the close control, Escape, and `/run?crew-links=1` deep link still work. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass. Playwright checks Chromium and WebKit at 390×844, 375×667, and 1280×800, open and closed, including Community links if present.

## Additional Analysis (Standard / Full)

- Current findings / affected components and interfaces: `.run-notes-popover` in `app/globals.css` is `min(24rem, calc(100% - 1.3rem))` wide and `height: fit-content`, with a 22% navy backdrop and no blur. The markup in `components/run/RunCrewNotes.tsx` does not need to change.
- Alternatives and dependencies: A darker backdrop alone would help, but a short wide card on desktop would still feel undersized. Stretching the sticky notes to fill a taller sheet would look unnatural. No new packages.
- Risks, costs and deferred work: Physical iPhone testing is still outstanding. A very small phone (for example 320×568) still clamps to the viewport. Deferred: any later request to restyle the notes themselves.
- Revisit triggers: Raj finds the sheet too large, too sparse, or the backdrop too dark or too light.

## Security Impact

- No new third-party scripts, embeds, pixels, or analytics.
- No secrets, tokens, or environment variables.
- No forms, accounts, or visitor data collection. The change is CSS only.

## Approval

- User approval / date / proposal revision or scope: Raj approved making the Crew links popup taller and, on desktop, as wide as the text column, on 2026-11-25 at about 5:20 PM America/Toronto, then asked to use best design judgment rather than a fixed 20–30% height increase.
- Conditions and separately authorized external actions: A new branch, commits, and a pull request to `main` are authorized. Merge, push to `main`, and production deploy are not authorized.
- Material amendments / renewed approval: None yet.

## Results (after implementation)

- Actual changes and files:
  - `app/globals.css` — the Crew links popup width now follows the `.run-copy` column on desktop (34rem from 800px, 40rem from 1100px). The sheet has a viewport-aware minimum height (26rem, rising to 58dvh or 32rem on taller phones; 36rem on desktop) and more padding. The backdrop is 48% navy with a 6px blur.
  - `docs/run/STATUS.md` and `docs/work/016-run-crew-links-popup.md` — this record.
- Verification: `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed on 2026-11-25 (America/Toronto). The first `next build` stopped to show a Next.js 16.4.2 security upgrade reminder; a retry of the same command completed successfully and prerendered `/run`. Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800 all passed: the desktop popup is exactly as wide as the text column (640px at 1280, delta 0); phone sheets are 362×490 at 390 and 347×416 at 375; the close button, Escape, and `/run?crew-links=1` deep link still work. Screenshots, including production befores, are in `/workspace/run-popup/`. Not tested on a physical iPhone.
- Remaining follow-ups: Merge and production deploy need a separate approval. PR #2 remains revertable with `git revert 74c68a8d`. Next.js still recommends a security upgrade; that is out of scope for this PR.

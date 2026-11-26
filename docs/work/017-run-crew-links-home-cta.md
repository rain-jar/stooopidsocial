# 017 — Homepage link in the Crew links popup

- Status: Implemented, awaiting review
- Proposal depth and reason: Standard — one new action in the existing Crew links paper on `/run`, with no new page and no new dependency.
- Source requirements / milestone: The Crew links popup lists Socials, Apps, and Community, and then stops. Raj asked for a way back to the main Les Stooopids page from the bottom of that paper, without a full reload, and without the popup staying on screen after the move.

## Proposal (all depths)

- Outcome, scope and non-goals: Add a footer inside the Crew links paper, under the Community group. A thin hand-drawn divider sits above one full-width button, "Visit Les Stooopids →", that goes to `/` with the Next.js client router. Closing still works from the X, Escape, and the backdrop, and the sheet stays hidden until Crew links is opened. Non-goals: new links in the sticky notes, a modal library, restyling the section tags, a Next.js upgrade, merge to `main`, and production deploy.
- Recommended approach and why: Keep the native popover. Put the label in `data/run.ts` and the link in a small client component so the rest of `RunCrewNotes` can stay a server component. Use `<Link href="/">`, and call `hidePopover` on click and when that navigation starts, so the top layer does not linger. Draw the button with the same press shape as "This week's details" (3px border, 22px radius, offset shadow, bold label) as a navy outline on the cream paper. `display: flex` stays only on `.run-notes-popover:popover-open`. The notes board scrolls when the sheet hits its max height; the footer stays at the bottom of the paper.
- Future fit, tradeoff and reversal effort: The popup can send someone home without covering that job with another control on the Sunday row. The footer uses some of the paper that used to be empty margin. Reversal is a revert of this branch. It does not rewrite history and does not affect the PR #2 revert point (`74c68a8d`).
- Acceptance criteria and verification: On `/run` without `?crew-links=1`, the popup is closed on load (`display: none`, not `:popover-open`) and the intro is unobstructed. Opening Crew links shows Socials, Apps, and Community, the navy backdrop, and the CTA inside the paper, both collapsed and with Community expanded. X, Escape, and a backdrop click each close it. The CTA is a Next.js `<Link href="/">`: `window.__marker` set before the click is still `1` at `/`, and no new document load happens. After that navigation the popup is gone. Desktop sheet stays about 640×576 and as wide as `.run-copy`. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.

## Additional Analysis (Standard / Full)

- Current findings / affected components and interfaces: `.run-notes-popover` in `app/globals.css` is a native popover. After work record 016, `display: flex` is only on `:popover-open`, which is what keeps the closed sheet at `display: none`. The notes are grouped from `runCrewLinkGroups` in `data/run.ts`. "This week's details" is a `.run-press` button: gold fill, 3px near-black border, 22px radius, and a 4px offset shadow. The new control keeps that geometry and uses navy for the border, type, and shadow so it reads as an outline on the cream paper.
- Alternatives and dependencies: A plain `<a href="/">` would reload the document and drop in-memory state. Putting `display: flex` back on the base popover rule would show the sheet on load again. No new packages.
- Risks, costs and deferred work: On a 375×667 phone the previous collapsed sheet was 347×416, which already filled that height with the notes. A footer under a fully visible Community group does not fit in 416px, so the collapsed sheet there is 347×490 (the same height as the 390 phone). Forcing 416px hid the Community tag behind the notes scroll. When the sheet would pass the viewport, the notes board scrolls and the footer stays. Not tested on a physical iPhone. Deferred: any later request to restyle the notes themselves.
- Revisit triggers: Raj wants the 375 sheet held at 416px even if Community must scroll, or wants the button filled gold like "This week's details" instead of a navy outline.

## Security Impact

- No new third-party scripts, embeds, pixels, or analytics.
- No secrets, tokens, or environment variables. Local build and browser checks used placeholder Supabase values and a local stand-in for published links. Those values are not in the branch.
- No forms, accounts, or visitor data collection. The link is an in-site navigation to `/`.

## Approval

- User approval / date / proposal revision or scope: Raj approved this footer in the task for the branch: divider, full-width "Visit Les Stooopids →", Next.js `<Link href="/">`, and `hidePopover` on click or route change, on 2026-11-26.
- Conditions and separately authorized external actions: A branch, commits, and a pull request to `main` are authorized. Merge, push to `main`, and production deploy are not authorized. The Next.js security upgrade is out of scope.
- Material amendments / renewed approval: After the homepage link shipped in PR #8, Raj asked for the footer button to stay on `/run` instead of going to the homepage, and to use the label "Run Crew Home 🏠", on 2026-11-25 at about 10:21 PM America/Toronto. The control is now a button that hides the popover in place (`popoverTargetAction="hide"`). It does not navigate, reload, or auto-scroll. The footer, divider, navy-outline style, and sheet sizes stay the same.

## Results (after implementation)

- Actual changes and files:
  - `data/run.ts` — `runCrewHomeCtaLabel` is `Visit Les Stooopids →`.
  - `components/run/RunCrewHomeLink.tsx` — client component. Renders `<Link href="/">` with the press classes. Calls `hidePopover` from the click, from `onNavigate`, and when the control unmounts, and only if the popover is actually open.
  - `components/run/RunCrewNotes.tsx` — footer after the notes board: a divider, then that link. Section tags, headings, and the close button are unchanged.
  - `app/globals.css` — footer, hand-drawn divider, and navy-outline button. The open popover is a column with overflow hidden so the notes board scrolls and the footer stays at the bottom. `display: flex` remains only on `.run-notes-popover:popover-open`.
  - `docs/run/STATUS.md` and `docs/work/017-run-crew-links-home-cta.md` — this record.
- Verification: `npm run lint` and `npx tsc --noEmit` passed on 2026-11-26. The first `npm run build` finished page generation and then stopped on the Next.js 16.4.2 security reminder. The same command retried successfully and prerendered `/run`. Next.js was not upgraded. Playwright Chromium and WebKit at 390×844, 375×667, and 1280×800, without `?crew-links=1`, passed 114/114. Each run checked: closed on load (`display: none`, not `:popover-open`, intro unobstructed); open with Socials, Apps, Community, the backdrop, and the CTA inside the paper, collapsed and with Community expanded; close by X, Escape, and backdrop, each from a fresh open; `window.__marker = 1` still `1` at `/` with no document request; popup absent after that navigation. Measured sheets: desktop collapsed 640×576 (same width as `.run-copy`), 390 collapsed 362×490, 375 collapsed 347×490. Expanded with two community links: 640×614, 362×586, and 347×586, footer still inside the paper. WebKit heights were within 0.2px of Chromium. Screenshots: `/opt/cursor/artifacts/run-crew-cta-390-load.png`, `/opt/cursor/artifacts/run-crew-cta-390-open.png`, `/opt/cursor/artifacts/run-crew-cta-375-community-expanded.png`, `/opt/cursor/artifacts/run-crew-cta-1280-open.png`. Not tested on a physical iPhone.
- Follow-up (after PR #8): The footer CTA no longer goes to `/`. `runCrewHomeCtaLabel` is now "Run Crew Home 🏠". `RunCrewHomeLink.tsx` was removed; the footer is a `<button>` with `popoverTargetAction="hide"`, the same close action as the X. Clicking it closes the sheet and leaves the visitor on `/run`, with no navigation and no auto-scroll.
- Remaining follow-ups: PR #2 remains revertable with `git revert 74c68a8d`. Next.js still recommends a security upgrade; that is out of scope for this PR.

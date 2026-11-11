# 010 — Run crew page v1

- Status: Complete
- Proposal depth and reason: Standard — new public page, motion, and external links, on the existing stack.
- Source requirements / milestone: Approved "Run crew page v1" for `/run`, including the 2026-11-10 amendment that replaces Instagram embeds with a Rolodex.

## Proposal (all depths)

- Outcome, scope and non-goals: Replace the `/run` stub with a crew-styled page: duck hero, Stooopid Sunday, FAQs, pacing app, and a Rolodex of local photos. Add Run next to Linktree in the shared header, and a Run link on `/links`. Non-goals: Instagram embeds, Graph API, race tracker, analytics, admin editing, real copy/photos, merge to `main`, production deploy.
- Recommended approach and why: One content module (`data/run.ts`), page-scoped layout and CSS, and two client components (duck, Rolodex). Reuse the crew colors already on `/links`. No new dependency.
- Future fit, tradeoff and reversal effort: Photos and copy swap in place. A later Graph API feed can replace the Rolodex data source. Reversal is deleting `app/run` additions, `components/run`, `data/run.ts`, `public/run`, and the Run links.
- Acceptance criteria and verification: Header Run opens `/run`. Five sections render in order. Duck drops, holds, runs, and peeks per section. Rolodex works by pointer, buttons, and keyboard. Reduced motion skips the run. 375px and desktop. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.

## Additional Analysis (Standard / Full)

- Current findings / affected components and interfaces: `app/run/page.tsx` was a stub using the dark header. Work record 009 removed Run from `components/layout/Header.tsx`. `/links` had no in-page Run link. Palette tokens for navy, gold, and pavement already exist as literals on `/links`.
- Alternatives and dependencies: Instagram embeds were the earlier idea and were replaced by the approved Rolodex. No package was added. JetBrains Mono is loaded with `next/font/google` on the run layout only.
- Risks, costs and deferred work: Motion can cover tap targets on a narrow phone; the duck is confined to a left lane and is `pointer-events: none`. Deferred: live Instagram Graph API (Business account), race tracker, analytics, admin editing, real copy and photos.
- Revisit triggers: Raj supplies final copy or photos, or approves a live feed, analytics, or a production deploy.

## Security Impact

- No new third-party scripts, embeds, pixels, or analytics.
- No secrets, tokens, or environment variables.
- No forms, accounts, or visitor data collection. The page is static content plus links.
- External destinations are the two approved URLs, opened with `target="_blank"` and `rel="noopener noreferrer"`: `https://anyonecanpacebeta.pages.dev/` and `https://www.instagram.com/stooopidcrew/`.
- Duck and photo files are local, processed offline, and served from `public/run/`.

## Approval

- User approval / date / proposal revision or scope: Raj approved the proposal in chat on 2026-11-10 (America/Toronto), including the amendment that replaces Instagram embeds with a Rolodex gallery.
- Conditions and separately authorized external actions: Branch commits and a pull request are authorized. Merge, push to `main`, and production deploy are not authorized.
- Material amendments / renewed approval: Rolodex instead of Instagram embeds, recorded above. Putting Run back in the shared header intentionally reverses the part of work record 009 that removed it.
- Mobile follow-up, approved by Raj on 2026-11-10 at about 7:32 PM America/Toronto, after he reviewed the preview: desktop stays as approved. Phones under 768px only: collapse the hero after the 2 second hold, with a small scroll cue during the hold; the peeking duck stays on screen inside a section and runs only when the next heading enters the upper viewport, along that heading's underline, then tucks into a corner gap; no left gutter, content is full width with equal side padding; the duck is a button that hops when tapped; in Photos it peeks over the Rolodex. Reduced motion stays a static duck with no snap. Scroll-snap on phones stays proximity, not mandatory.
- Phone peek and Rolodex follow-up, approved by Raj on 2026-11-10 at about 8:37 PM America/Toronto. Desktop stays as approved. On phones, the static peek is not clipped by its own box: a pole-free asset is tucked so only the left edge of the screen cuts it, about 70px tall, with the eye, headband knot, full beak, and hand visible, plus a thin hard shadow on that edge. The phone Rolodex takes a tap on the right half as next and the left half as previous, keeps horizontal swipe, hides the previous/next buttons visually while leaving them keyboard-reachable, shows progress dots, nudges the top card once when the section first appears, and ends on a Follow @stooopidcrew card that wraps back to the first photo. Reduced motion does not nudge.
- Spacing, Photos peek, and palette follow-up, approved by Raj on 2026-11-10 at about 9:07 PM America/Toronto. Phones lose the reserved blank bands: FAQ cards use the normal 0.75rem stack gap, and the Sunday and pacing buttons keep their normal margin. The duck does not reserve space. It overlays the left edge, about two-thirds off screen, with a few pixels of overlap into the content margin, beside a heading, a card edge, or a button. Photos on phones uses that same left-edge peek. The over-the-Rolodex peek is gone. Desktop keeps the side peek. `/run` at every width uses the `/links` background class, with the 10px graph paper kept. Header and footer use the same cream token.
- Visibility and contrast follow-up, approved by Raj on 2026-11-10 at about 9:41 PM America/Toronto after he reviewed a phone screenshot. On phones the peek must show the eye, the headband, and the whole beak, about half of the peek art, always above cards and buttons, and never on top of text or tap targets. It anchors beside the heading, and on a long section it sticks in the left margin. The cream rectangles behind plain text come out. The `/links` gradient scrolls with the page. Text is navy on the cream-to-gold zone and cream on the navy zone.

## Results (after implementation)

- Actual changes and files:
  - `components/layout/Header.tsx` — Run link beside Linktree.
  - `app/links/page.tsx` — in-page Run link.
  - `app/run/layout.tsx` — JetBrains Mono and the `/links` background on the run scrollport.
  - `app/run/page.tsx` — five sections, own header and footer. No reserved duck gaps.
  - `app/globals.css` — shared linktree color tokens, graph paper, press buttons, duck, Rolodex, phone scroll-snap.
  - `components/run/*` — header, footer, link, duck, Rolodex.
  - `data/run.ts` — copy, links, photo list, duck frame paths.
  - `public/run/duck/` — start, run-a, run-b, peek, rest. Backgrounds removed by edge flood-fill so the cream body stays. `run-a` and `run-b` share one canvas so the cycle lines up.
  - `public/run/photos/01.webp`–`06.webp` — labeled placeholders.
  - `docs/run/PROJECT.md`, `docs/run/STATUS.md`, this record.
- Acceptance criteria results and observed verification evidence:
  - Header Run and the `/links` Run link are present. `/run` does not use the dark site header.
  - Sections render in order: hero, Stooopid Sunday (Sunday 10 AM, Café Tranquille, 1442 Rue Clark, café entrance, "This week's details"), FAQs (`details`/`summary`), pacing app, Rolodex with a final Follow `@stooopidcrew` link.
  - Duck: drop into the blocks, hold, run to Sunday, peek with the pole on the viewport edge. Scrolling to a later section runs and peeks there. Scrolling back to the top returns the rest pose. No measured overlap with text or controls at 375×812 or 1280×800.
  - Rolodex: next/previous buttons, ArrowRight, and a horizontal drag each advanced the card. Captions render when present. Loading status reads "Loading photos". Aborting `/run/photos/*` shows one fallback card linking to Instagram.
  - `prefers-reduced-motion: reduce`: no moving duck, rest pose in the hero, scroll-snap off.
  - Focus ring visible on the Sunday button.
  - A narrow-window screen recording shows the drop into the blocks and the run off the hero. A second recording shows the peek beside Sunday, an FAQ opening, and the photo Next/Previous buttons changing the card and the 1/6 counter.
  - ESLint, `npx tsc --noEmit`, and `npm run build` passed. `/run` is a static route.
- Checks not run / uncertainty:
  - Not verified on a physical iPhone or in Safari/Firefox.
  - The 2 second hold and the run are timer-based; a slow device could start them later. Reduced motion does not depend on that timer.
  - Local `/links` can show "Links are temporarily unavailable" when Supabase env is absent. That state predates this slice. The Run link is outside that error block.
  - Vercel preview is a platform deploy from the PR branch, not a production release. The URL is reported when GitHub shows the deployment.
- Deviations / residual risks / follow-ups:
  - Sunday has no timezone label. Assumption D4 in `docs/run/PROJECT.md`.
  - Desktop hides the hero landing stage after the duck leaves so the peek sits beside Sunday. That desktop path was not changed by the 7:32 PM mobile amendment.
  - Phones under 768px, after the 9:07 PM amendment: no reserved vertical gaps. Measured FAQ card gap is 12px and the Sunday note-to-button gap is 24px at 375px. The static peek uses `peek-mobile.webp`, about 70px tall. At 375 and 390 its box starts at -46px and ends at 23px, while the text column starts at 18px, so about two-thirds is off the left edge and about 5px overlaps the content margin. It sits beside the Sunday button, an FAQ card edge, and the photo card. Question text stays clear of the beak. Photos uses this edge peek, not a peek over the Rolodex. Desktop at 1280 still uses `peek.webp` in the side lane, with visible previous/next buttons and no dots.
  - `/run` background is `.linktree-textured-background`, held to the window, with the grid at 10px instead of the 16px `/links` pitch. Header and footer are `--linktree-cream`. Cards and the Rolodex fill are white so they stay separate from the cream and readable on the navy. Navy text on the dark half of the poster sits on a 92% cream scrim. Gold buttons keep near-black type. Checked at 375, 390, and 1280.
  - 9:41 PM follow-up: the scrims are gone. The page is two scrolling zones that reuse the linktree tokens. The light zone runs cream to gold and uses navy type (navy on gold is 4.83:1). The dark zone, from pacing through the footer, is navy with cream type (9.25:1). The smooth gold-to-navy blend is not used, because neither navy nor cream type meets WCAG AA on that blend. Cards stay white with navy type. Phone headings are indented. The peek shows about 54% of `peek-mobile.webp`, with the beak tip just left of the text column, and sticks under the header while a long section is on screen. A 1px cream drop-shadow keeps the duck silhouette readable on navy. Playwright Chromium and WebKit, including iPhone 13, iPhone 14, 375×667, 430×932, 1280, and 1440: settled peeks had no text overlap, no horizontal scroll, and no text backgrounds. axe-core `color-contrast` reported no violations. It marked the light-zone gradient incomplete because it will not score a multi-layer gradient; the stop colors were checked by hand.
  - Gallery images that fail one-by-one show the fallback inside that card. If every photo fails, the stack is replaced by one fallback card.
  - Real copy, photos, Graph API feed, race tracker, analytics, and admin editing remain deferred.
- Canonical documents updated: `docs/run/PROJECT.md`, `docs/run/STATUS.md`, this file. No repo-root `PROJECT.md` or `STATUS.md`.

## Objective

Ship the approved v1 page on a review branch without merging or deploying production.

## Non-Goals

Instagram embed or Graph API, race tracker, analytics, admin UI, invented crew facts, new npm dependencies, merge, production deploy.

## Deployment

Implementation commit: `b55e3faba2a4400399d4129048be427fe36b74f5` on `cursor/run-crew-page-v1-ea82`.

Not deployed to production. Vercel preview for this branch is Ready: `https://stooopidsocial-git-cursor-run-crew-pa-7113dc-raj-nairs-projects.vercel.app` (deployment protection redirects anonymous requests to Vercel SSO). That preview is not a production release.

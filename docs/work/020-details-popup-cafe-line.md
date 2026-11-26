# 020 — Café line and no route-advisories copy

## Request

On the live "This week's details" popup, Raj asked to drop the "No route advisories" line (it isn't needed) and to add "Café Tranquille" directly under the date and time, between that line and the duck graphic (t60u, 26 Nov 2026, America/Toronto).

## Decisions

- The route-advisories section is gone, including the empty "No route advisories" line and the list that would have appeared if notices existed. Files and helpers that only served that section are removed. Outfit weather notes on the duck card are unchanged.
- A secondary line under the meet date and time shows the meeting spot name from `sundayEvent.place.name` in `data/run.ts` (via `EVENT` in `lib/sunday/event.ts`), so the café name is not hardcoded in the popup.
- The line uses the existing paper type, a little smaller and lighter than the date, centered with it.
- Approved in chat; this note records the work.

## Files

- `components/run/sunday/SundayDashboard.tsx` — café line; advisories UI removed
- `components/run/sunday/sunday.css` — `.dash-run__place`; advisories styles removed
- `data/run.ts` — `sundayRouteNames` removed
- Removed: `components/run/sunday/NoticeList.tsx`, `lib/sunday/notices.ts`, `lib/sunday/routeAdvisories.ts`, `data/sunday-advisories.json`

## Verification

Lint, `tsc`, and `next build` (retry the Next.js 16.4.2 security reminder; do not upgrade). Playwright in Chromium and WebKit at 390, 375, and 1280: both popups closed on load; no advisories text; the café line sits under the date and time and above the duck; map buttons fully visible at 1280×800; close via X, Escape, backdrop, and Run Crew Home. Screenshots: `/workspace/run-details-popup-cafe/`.


## Follow-up (t62u)

Raj asked to tighten spacing so the collapsed popup fits without scrolling on smaller phones too, including the full Updated / Refresh line, without hurting readability (t62u, 26 Nov 2026, America/Toronto).

### Decisions

- Only vertical padding, margins, and gaps were reduced. Font sizes and tap targets stay as they were (map buttons and Refresh remain 44px; Run Crew Home is unchanged).
- The duck graphic is modestly smaller (168px, down from 230px / 196px on desktop). On short viewports (max-height 700px, such as 375×667) it goes to 120px so Location Deets, the map buttons, and the Weather details bar still fit.
- The Open-Meteo credit still sits under Updated / Refresh. On some phone heights that credit may still need a short scroll; it is not required to be on screen when the popup opens.
- On 375×667 the Updated / Refresh row still needs a short scroll. Fitting it would have meant shrinking the duck further than feels readable. Map buttons and the collapsed Weather details bar do fit.

### Files

- `components/run/sunday/sunday.css` — tighter popup and card spacing; short-height duck size

### Verification

Lint, `tsc`, and `next build` (retry the Next.js 16.4.2 security reminder; do not upgrade). Playwright in Chromium and WebKit at 390×844, 375×812, 375×667, and 1280×800. Screenshots: `/workspace/run-details-popup-tight/`.


## Follow-up (t63u)

The tighter card felt cramped, and the feels-like sticker overlapped the café line. Raj asked to move the weather meta at the bottom (Updated time, Refresh, and the Open-Meteo credit) into the expandable Weather details section, then give the Sunday card more room so nothing overlaps (t63u, 26 Nov 2026, America/Toronto).

### Decisions

- Updated, Refresh, and the CC BY 4.0 credit only appear when Weather details is expanded. If there is no forecast yet, they still show under Location Deets so people can refresh.
- The Sunday card gets its earlier padding and gaps back, plus space above the duck so the feels-like sticker does not cover the café line. The duck is 230px again (220px on desktop, 196px on short phones). Font sizes are unchanged. Tap targets stay at least 44px.
- Expanding Weather details can still need a scroll, which is expected.

### Files

- `components/run/sunday/OutfitView.tsx` — status and credit render inside the fold-out
- `components/run/sunday/SundayDashboard.tsx` — move those blocks out of the collapsed layout
- `components/run/sunday/sunday.css` — more open card spacing; clearance for the sticker

### Verification

Lint, `tsc`, and `next build` (retry the Next.js 16.4.2 security reminder; do not upgrade). Playwright in Chromium and WebKit at 390×844, 375×812, 375×667, and 1280×800, including overlap checks and expanded Weather details (Updated, Refresh, credit; Refresh works). Screenshots: `/workspace/run-details-popup-fold/`.

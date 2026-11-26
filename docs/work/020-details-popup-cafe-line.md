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

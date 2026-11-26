# 019 — Put Location Deets first in the details popup

## Request

On the live "This week's details" popup, Location Deets sat below "Running another time?" and the Weather details fold-out, so the map buttons were easy to miss and were clipped at the footer on a 1280×800 desktop when the outfit copy ran long. Raj asked to swap Location Deets and Weather details, because the meet location is more important (t58u, 26 Nov 2026, America/Toronto).

## Decisions

- After the Sunday card (date, duck, outfit, and the one-line weather summary), show Location Deets with its map buttons, then the Weather details fold-out, then "Running another time?".
- Each section keeps its existing look. Location stays on the graph paper; Weather details stays a +/− fold-out. The fold-out in "Running another time?" is unchanged.
- The board's padded scrollport is unchanged, so the last section still clears the Run Crew Home footer.
- Approved in chat; this note records the work.

## Files

- `components/run/sunday/OutfitView.tsx` — shared `WeatherDetails` fold-out; main Sunday outfit hides its in-card copy
- `components/run/sunday/SundayDashboard.tsx` — new section order
- `components/run/sunday/sunday.css` — spacing where Weather details meets "Running another time?"

## Verification

Lint, `tsc`, and `next build` (retry the Next.js 16.4.2 security reminder; do not upgrade). Playwright in Chromium and WebKit at 390, 375, and 1280: both popups closed on load; Location Deets comes before Weather details; map buttons fully visible at 1280×800 without scrolling; close via X, Escape, backdrop, and Run Crew Home. Screenshots: `/workspace/run-details-popup-swap/`.

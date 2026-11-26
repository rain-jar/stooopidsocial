# 019 — Put Location Deets first in the details popup

## Request

On the live "This week's details" popup, Location Deets sat below "Running another time?" and the Weather details fold-out, so the map buttons were easy to miss and were clipped at the footer on a 1280×800 desktop when the outfit copy ran long. Raj asked to swap Location Deets and Weather details, because the meet location is more important (t58u, 26 Nov 2026, America/Toronto). In t59u he asked to remove the "Running another time?" section entirely.

## Decisions

- After the Sunday card (date, duck, outfit, and the one-line weather summary), show Location Deets with its map buttons, then the Weather details fold-out. "Running another time?" and its hour picker are gone.
- Each remaining section keeps its existing look. Location stays on the graph paper; Weather details stays a +/− fold-out.
- The board's padded scrollport is unchanged, so the last content still clears the Run Crew Home footer.
- Approved in chat; this note records the work.

## Files

- `components/run/sunday/OutfitView.tsx` — shared `WeatherDetails` fold-out; the Sunday outfit no longer embeds it
- `components/run/sunday/SundayDashboard.tsx` — new section order; picker removed
- `components/run/sunday/sunday.css` — picker and "Running another time?" styles removed
- `lib/sunday/runTime.ts` — picker-only helpers removed

## Verification

Lint, `tsc`, and `next build` (retry the Next.js 16.4.2 security reminder; do not upgrade). Playwright in Chromium and WebKit at 390, 375, and 1280: both popups closed on load; Location Deets comes before Weather details; no "Running another time" copy; map buttons fully visible at 1280×800 without scrolling; close via X, Escape, backdrop, and Run Crew Home. Screenshots: `/workspace/run-details-popup-swap2/`.

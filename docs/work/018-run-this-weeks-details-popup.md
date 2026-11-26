# 018 — This week's details paper popup

## Request

On `/run`, "This week's details" opened `https://anyonecanpacebeta.pages.dev/?sunday` in a new tab. Raj asked for a paper popup like Crew links that recreates the look and logic of the top of that Sunday dashboard (everything above "Generate Insta Story Pic"), without the AnyoneCanPace brand. Approved in t54u (25 Nov 2026, America/Toronto).

## Decisions

- The button opens a native `popover="auto"` sheet that reuses the Crew links paper, backdrop, and width family. `display: flex` is applied only under `:popover-open`.
- Inside, a separate implementation of the Stooopid Sunday dashboard from `ShereenElaidi/anyoneCanPace-beta@376558b`: title "Stooopid Sunday", next-Sunday card, dressed duck, outfit copy, Weather details, "Running another time?" with hour chips, route advisories, loading/stale/Check outside + REFRESH, Location Deets (COPY MAP LINK / OPEN MAP), the quiet Updated line, and the Open-Meteo CC BY 4.0 credit.
- Excluded: the AnyoneCanPace brand, the Insta story section, and the "ANYONE CAN RUN. ANYONE CAN PACE." footer slogan.
- Close: an X in the top corner, Escape, backdrop click, and a bottom "Run Crew Home 🏠" button that hides the popover. No separate HOME button — in the pacing app HOME leaves the dashboard for the app menu; here the friendly equivalent is closing back onto the Run page.
- Event data lives in `data/run.ts` (`sundayEvent`) with a comment naming the source commit. Advisories are in `data/sunday-advisories.json`. Weather is a browser GET to Open-Meteo's public GEM endpoint for central Montréal (`45.5017, -73.5673`), cached 30 minutes in `localStorage` under `stooopidsocial:sunday-weather:v1`. Times use America/Toronto.
- "Open the pacing app" in the later `/run` section is unchanged.
- Content scrolls inside the paper. Desktop width matches the text column.

## Why not an iframe or a shared package

The pacing app is cross-origin and has no embed flag, so we could not hide the brand or the Insta section from the parent page. A shared package would stay in sync more easily, but Raj asked for a separate copy of the look and the logic. The two copies can drift if the meet or outfit rules change later; that is an accepted trade-off.

## Shereen's code

The implementation is a separate port, not a dependency on her repo. Duck art, outfit rules, and dashboard styling originated in her beta app. Giving her a heads-up is a courtesy, not a blocker: she may want to know the community site now shows a copy of the Sunday dashboard, and that `event.json` / outfit rules will need to be updated in two places if they change. The popup credits Open-Meteo as her app does.

## Files

- `components/run/RunWeekDetails.tsx` — popover chrome
- `components/run/sunday/*` — dashboard UI, duck, CSS
- `lib/sunday/*` — forecast, outfit, event, cache, advisories
- `public/run/sunday/` — duck layers and sky backdrop
- `data/run.ts`, `data/sunday-advisories.json`, `app/run/page.tsx`

## Verification

Lint, `tsc`, and `next build` on this branch (retry the first Next.js 16.4.2 security reminder if it stops the build; do not upgrade). Playwright in Chromium and WebKit at 390, 375, and 1280: both popups closed on load; This week's details opens with the duck and outfit; fold-outs and hour chips work; map buttons work; close via X, Escape, backdrop, and Run Crew Home; Crew links still works; offline/forecast failure shows the fallback. Screenshots: `/workspace/run-details-popup/`.

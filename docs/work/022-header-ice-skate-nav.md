# 022 — Header Ice Skate nav

## Request

Hide Linktree from the shared site header and add an "Ice Skate" nav item that does not go anywhere yet, because the page has not been created (t70u, 26 Nov 2026, America/Toronto). Approved in chat.

## Decisions

- Change is limited to `components/layout/Header.tsx`. The `/links` page, the Run page header, and other routes are unchanged.
- Nav items live in a small array so Linktree can be restored later by removing `hidden: true`.
- Visible order is Run, then Ice Skate.
- Ice Skate is a non-navigating `span` with `aria-disabled="true"` and `title="Coming soon"`. It uses the same typography, hover, and focus styles as Run, with a 44px minimum tap height, but it is not a link and will not 404.
- The framed-header homepage idea from t68u is parked and out of scope.

## Files

- `components/layout/Header.tsx`
- `docs/work/022-header-ice-skate-nav.md`

## Verification

Lint, `tsc`, and `next build` (retry the Next.js 16.4.2 security reminder; do not upgrade). Chromium screenshots of `/` at 390 and 1280, confirming the header fits on one line at 390 and that tap targets are 44px. Screenshots: `/workspace/header-ice-skate/`.

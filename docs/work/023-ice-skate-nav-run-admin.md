# 023 — Ice Skate nav on the Run header

## Request

Add the same Ice Skate nav item to the Run page header, and make the same Linktree / Ice Skate change on the admin pages (t71u, 26 Nov 2026, America/Toronto). Approved in chat.

## Decisions

- `components/run/RunHeader.tsx` now shows Run, then a non-navigating Ice Skate item (`span` with `aria-disabled="true"` and `title="Coming soon"`), styled like the existing Run header links, with a 44px minimum tap height. The Run header did not have a Linktree item, so nothing was hidden there.
- Existing Run header links still come from `data/run.ts`. Ice Skate is added in the header component so a later page can be wired up without changing the shared `RunLink` type (that type is also used for real links that need an `href`).
- Admin / manage pages already use the shared `components/layout/Header.tsx` from PR #13, so they already hide Linktree and show Ice Skate. No admin header code change was needed.
- The `/links` page and the public homepage header are unchanged in this commit.

## Files

- `components/run/RunHeader.tsx`
- `docs/work/023-ice-skate-nav-run-admin.md`

## Verification

Lint, `tsc`, and `next build` (retry the Next.js 16.4.2 security reminder; do not upgrade). Chromium screenshots of `/run` and an admin page header at 390 and 1280. Confirm the Run header fits on one line at 390, and that both Run popups start closed. Screenshots: `/workspace/ice-skate-run-admin/`.

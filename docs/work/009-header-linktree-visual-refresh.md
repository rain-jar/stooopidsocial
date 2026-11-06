# Header and Linktree Visual Refresh

- Status: Complete
- Date: 2026-11-06
- Source requirement: Keep the home navigation at the left of the header, remove About, Run, Skate, Hike, and Dance, retain Linktree as the sole header navigation link, restyle the Linktree page background using the fine grid texture observed at `https://anyonecanpacebeta.pages.dev/` with the approved blue, gold, and white palette, and add a subtle Freeform/Excalidraw-style canvas texture to the existing dark homepage.
- Approval: Explicitly approved by the user on 2026-11-06.

## Objective

Simplify the global header to the two requested destinations, give the existing Linktree page a responsive graph-paper texture over a white-to-gold-to-blue transition, and add restrained canvas texture to the dark homepage without changing data, content, actions, or architecture.

## Current-State Findings

- The shared header shows a home brand link, five placeholder links, and Linktree on desktop; mobile repeats these links behind a menu toggle.
- The Linktree page uses a flat blue background with gold foreground text.
- The reference surface uses a fine, low-contrast square grid on a warm off-white ground.
- The working tree was clean before this phase.

## Scope and Approach

- Replace both desktop and mobile menu variants with a single always-visible Linktree navigation link while retaining the existing home brand link.
- Remove now-unused client state and the mobile menu toggle.
- Add one page-scoped background class using layered CSS gradients: a fine grid texture plus the exact approved colors `#F5F0E8`, `#EF9F27`, and `#1B3F72`.
- Add a separate homepage-only CSS background using sparse low-contrast dots and a restrained charcoal glow while preserving the established near-black color.
- Adjust only Linktree foreground colors necessary to preserve contrast across the lighter upper background.

## Non-Goals

- No route, content, database, Linktree behavior, header position, dependency, or broader design-system change.
- No reuse or download of the reference site's proprietary artwork or assets.

## Risks and Rollback

- Layered gradients can reduce text contrast or create visual banding; verify representative mobile and desktop layouts and preserve solid-color fallbacks.
- Rollback is limited to restoring the header markup and removing the page-scoped background class/CSS rule.

## Acceptance Criteria

- The header contains the home link at left and Linktree at right at all supported widths.
- The removed navigation labels and mobile menu button are absent.
- The Linktree page shows a fine grid texture over a white-to-gold-to-blue background using the exact supplied colors.
- The homepage retains its dark palette and shows a subtle dotted canvas texture without competing with event cards or text.
- Linktree content, links, focus states, and readable contrast remain intact.

## Verification Plan

- Inspect the complete diff.
- Run ESLint and TypeScript validation.
- Run the production build.
- Verify the affected header and Linktree page at mobile and desktop widths, including keyboard focus.

## Actual Changes

- Simplified the shared header to the existing home brand link and one always-visible Linktree link; removed the unused placeholder links, mobile menu state, and menu button.
- Replaced the Linktree page's flat blue background with a CSS-only fine grid over the exact approved white, gold, and blue gradient.
- Changed Linktree foreground text to blue on the light upper surface and added restrained warm-white category-label capsules so headings remain readable as the gradient reaches blue.
- Strengthened the shared sticky header's explicit dark translucent background so both navigation links retain contrast while scrolling over the new page surface.
- Added a homepage-scoped dark canvas treatment with sparse soft dots and a restrained charcoal glow inspired by Freeform/Excalidraw work surfaces.

## Verification Evidence

- ESLint: passed.
- TypeScript (`npx tsc --noEmit`): passed.
- Next.js webpack production build: passed.
- `git diff --check`: passed.
- Authorized Chrome verification: desktop and 390×844 mobile layouts showed only the home and Linktree header destinations, retained working Linktree content, preserved visible focus styling, and maintained readable contrast across the gradient. The homepage dot canvas remained subtle and legible at both viewports without competing with event cards.
- No dependency, data, route, backend, or deployment configuration changed.

## Deployment

Production deployment was explicitly approved on 2026-11-06. Commit `7099868` was pushed to `origin/main`; Vercel production deployment `dpl_z8v56dPXSt9Qc642uijhAC6aaQyK` reached `READY`. Public smoke checks returned HTTP 200 for `/` and `/links`, found the new homepage and Linktree texture classes, and confirmed the header exposes Linktree without the removed placeholder navigation labels.

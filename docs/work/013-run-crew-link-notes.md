# Run crew link notes

## Status

Complete for local preview. The user requested the right-margin sticky notes and approved building a local preview after reviewing the design.

## Requirements and current state

Put Instagram, Strava, the pacing app, and optional community links on the run page as clickable notebook notes. The duck uses the left gutter, section offsets, and the main copy column to calculate its path. The public links page already reads published links through the Supabase links repository.

## Design and scope

- Pin the desktop notes just outside the right edge of the Stooopid Sunday copy, independent of section layout. Use a paper tab in the same header slot below the width needed for the notes. Its popover sits above the duck.
- Keep the three core shortcuts available, use the existing public repository for optional links, and suppress duplicate note destinations. Keep the run route prerenderable with periodic revalidation, and omit the optional note when those links are unavailable.
- Limit the change to the run page, its header, its note content, and run-scoped styling. The public Linktree route, admin, shared navigation, and publication are outside this preview.

## Risks and rollback

The notes could crowd the copy at intermediate widths, and long fundraiser labels could overflow. Use a width threshold with measured clearance, wrapping labels, and a bounded panel. Keep existing section markup, spacing, duck selectors, and stacking behavior. Revert the preview changes to restore the prior header and page.

## Acceptance and verification

Check desktop placement and spacing, mobile and the desktop breakpoint, keyboard opening and dismissing, public link destinations and optional content, and the duck's geometry and scroll behavior. Run lint, type-check, inspect the diff, and serve the local preview. Record limits of browser and environment verification.

## Implementation and verification

The notes sit 28 CSS pixels to the right of the Sunday copy at widths of 960 pixels and up. The narrower layout uses a native popover triggered from the existing header row. Both read the same set of optional published URLs. The production build prerenders the run route and schedules revalidation at five-minute intervals.

Lint, TypeScript, Webpack build, whitespace checks, and the local HTTP smoke check passed. In the in-app browser, the 960px and 1280px layouts had a clear right gutter and zero horizontal overflow. The 320px and 390px layouts opened Crew links within the viewport. Enter opened the popover and the Community disclosure, and Escape closed the popover and restored trigger focus. Opening the notes preserved the section offsets. The existing duck was observed peeking on desktop and running and peeking on mobile. One published community link appeared in both placements.

Physical-device and cross-browser checks were outside this preview. The build reported existing Next.js advisory and local calendar configuration warnings. The preview is local.

## In-page tab follow-up

Complete for local preview with the user's approval. The run header is reserved for page navigation. The compact trigger now sits at the lower-right edge of the existing run intro, and the same notes open as a bottom sheet. The wide layout uses the original right-margin placement.

The trigger and sheet stay out of document flow. At 320px and 390px, the in-app browser showed the bookmark below the last intro line, the duck in the left gutter, and no horizontal overflow. Opening the sheet preserved section offsets. The published community link expanded, the close button dismissed the sheet, and Escape restored focus to the bookmark. At 1280px, the notes still cleared the column by 28px and Crew links was absent from the header. Lint, TypeScript, and whitespace checks passed. This iteration used a local development preview; the production build was not repeated. Revert this follow-up to restore the first preview.

## Sunday action follow-up

Complete for local preview. The user observed disruption to the duck when the bookmark sat below the intro. The cream Crew links button now pairs with the gold Sunday details button, and its popover holds the sticky notes. The buttons use a row at the existing 800px desktop breakpoint and stack in document flow on narrower screens. The hero markup and duck code match the original page.

The 390px preview showed a 64px increase in the Sunday section and an equal shift in the FAQ, pacing, and photo offsets. The duck moved to the left of the FAQ heading at its new position. The two buttons fit at 320px, 800px, and 1280px without horizontal overflow. Opening the notes preserved section offsets. The Community link rendered, Escape restored focus on mobile, and the centered desktop popover closed with its close button. Lint, TypeScript, and whitespace checks passed. The production build and physical-device checks were outside this local preview.

The user then requested a centered popup at mobile widths as well. The local preview uses shared centered positioning and retains viewport-bounded scrolling. The in-app browser showed the popup centered at 320×568, including with Community expanded, and at 1280×800. Escape restored focus on mobile, and the desktop close button worked.

## Team review

The user approved a branch PR and Vercel Preview for team review. The final button reads **Crew links +**, the popup title is **Crew & community**, and the optional disclosure is **Community links**. Review the full preview site, including the calendar, run page, public links, and admin sign-in surface. Preview access and integrations use the existing Vercel configuration. Use read-only checks against shared services. After separate approval, a squash merge keeps this change together for a later Git revert if needed.

### Security Impact

The user explicitly approved a public preview URL after the tokenized Vercel Shareable Link was unreliable on phones. The approved exception is limited to the immutable review deployment hostname `stooopidsocial-1hll6d63n-raj-nairs-projects.vercel.app` for commit `ab5044d`. This is an access change for review, not a vulnerability fix. Anyone who discovers the hostname can load its public pages and reach the application's existing admin sign-in boundary. Privileged operations continue to require application authentication and rate limiting. Preview Turnstile rejects this hostname, so submissions cannot be tested end to end here. Production, branch-alias protection, role grants, and secrets are outside the change. Verify anonymous access to the exact preview and continued protection on the branch URL and admin routes. Remove the hostname exception in Vercel after review to restore its deployment sign-in requirement. Treat any unexpected data exposure as a reason to remove the exception immediately.

Vercel listed one exception for the approved hostname. A request without cookies, a token, or an authorization header returned HTTP 200 and rendered Crew links on that hostname. The branch alias pointing to the same build also returned HTTP 200. A separate project preview still redirected to Vercel sign-in, the review build's event admin route still redirected to its passcode page, and production still served the prior Run design. On rollback, confirm both aliases require authentication without a token and revoke the separately created Shareable Link if its access should also end. The plain URL is ready for team review.

### Shareable popup URL

The user approved adding `/run?crew-links=1` to PR #2. On arrival, open the existing native popover and let the visitor dismiss it normally. On dismissal, remove only the popup query parameter without reloading the page. Keep ordinary Run visits closed by default and preserve the existing static route and link data. Verify direct arrival, dismissal, URL cleanup, refresh, and the regular button. The original review URL is pinned to its deployment. Check access on the updated branch preview before sharing it. Preview protection changes require separate approval.

Local browser verification showed the popup opening and focusing its close button on arrival. Escape closed it and removed only `crew-links`, preserving an unrelated query parameter and the fragment. It stayed closed after refresh, and the regular button still opened it. ESLint and TypeScript passed.

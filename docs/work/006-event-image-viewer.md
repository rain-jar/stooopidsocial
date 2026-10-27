# Event Image Viewer

- Status: Complete
- Date: 2026-10-27
- Source requirement: Make the event image inside the event-details modal clickable so visitors can open an unobstructed, larger view suitable for taking a screenshot.
- Approval: Approved by the user on 2026-10-27.

## Objective

Add a focused full-screen image viewer to the existing event modal without changing event data, navigation, cards, or backend behavior.

## Current-State Findings

- `EventDetails` renders an optional event image at the top of the existing modal.
- The event modal already provides focus containment, Escape handling, a persistent close control, and mobile bottom-sheet behavior.
- Missing and failed images already fall back to generated event artwork.

## Proposed Approach

- Make only a successfully loaded event image interactive, with an accessible button label and visible zoom affordance.
- Open the image in a second native modal dialog above the event-details dialog.
- Display the complete image with `object-contain` against a dark, uncluttered background so it is easy to view or screenshot.
- Provide a persistent close button, Escape-to-close behavior, backdrop-click close behavior, keyboard focus containment, and focus return to the image trigger.
- Preserve the original image alt text and existing error fallback. Generated fallback artwork will not open because it is not a source image.
- Keep the event URL unchanged; the viewer is transient presentation state.

## Scope

- `components/events/EventDetails.tsx`: image trigger and full-screen viewer state/behavior
- `app/globals.css`: narrowly scoped dialog/backdrop styling if needed

## Non-Goals

- Downloads, image sharing, cropping, zoom gestures, galleries, backend changes, or dedicated event pages
- Changes to event cards, Sheet data, Drive permissions, image routing, or modal URL behavior

## Risks and Rollback

- Nested modal focus or Escape handling could accidentally close the event modal; verify the image viewer handles cancellation independently.
- Large images must remain contained within the viewport without distortion or page overflow.
- Rollback is limited to removing the image trigger/viewer and its scoped styles.

## Acceptance Criteria

- Clicking or keyboard-activating a real event image opens a full-screen contained image view.
- The viewer closes with its close button, Escape, or backdrop click without closing the underlying event modal.
- Focus returns to the image trigger after closing.
- Missing or broken images retain the existing fallback behavior and do not open a viewer.
- Desktop and mobile layouts remain usable; existing event modal behavior is unchanged.

## Verification Plan

- Run lint and TypeScript checks.
- Run the production build.
- Verify pointer and keyboard opening, close button, Escape, backdrop close, focus return, image containment, and missing-image fallback.
- Review the complete diff for unrelated changes.

## Actual Changes

- Made successfully loaded event images keyboard- and pointer-activatable with a visible “Expand image” affordance.
- Added a native full-screen image dialog that preserves the source image proportions with `object-contain` on a dark background.
- Added an always-visible close button, Escape handling, backdrop-area closing, focus containment, and focus return to the image trigger.
- Kept broken and missing images on the existing fallback path without exposing an unusable viewer.
- Kept event URLs, Sheet data, Drive authorization, cards, and the underlying event-modal behavior unchanged.

## Verification Evidence

- `npm run lint`: passed.
- `npm run build -- --webpack`: passed, including framework TypeScript validation.
- `npx tsc --noEmit`: passed after build-generated route types were complete.
- `git diff --check`: passed.
- Reviewed the complete scoped diff; no unrelated files were changed.

## Checks Not Performed

- Browser interaction testing was not performed because browser access was not authorized for this task. Pointer, keyboard, focus-return, and responsive behaviors are implemented using native dialog semantics and require final visual confirmation in a browser.

## Residual Risk

- Native nested-dialog behavior can vary at browser edges; the implementation uses supported dialog APIs, but final manual checks remain advisable across the stated supported browsers.

# Calendar bulletin board

## Status

Deployed. The user reviewed the local design and approved production rollout. Independent mobile and keyboard verification is pending.

## Requirements and current state

The user supplied Image A for the board, lettering, and palette, and Image B for the instant-photo frame. The calendar currently uses a dark textured background, an image-led event grid, and separate event details and submission dialogs.

## Design and scope

- Use warm cork, a wood-look border, colorful pushpins, and slightly offset paper letter tiles spelling “Stooopid.” Use a bold condensed “Calendar” heading and expose the full title as one accessible heading.
- Give each event an instant-photo frame with an image above a paper caption containing its title, date, time, venue, and existing details affordance. Keep the entire card interactive and retain fallback artwork and status labels. Use modest desktop tilts and straight single-column cards on phones.
- Carry warm paper, dark text, and board accents into event details and Add Your Event. Include form fields, validation messages, controls, and unavailable states in the contrast review. Retain the centered desktop dialog and mobile bottom sheet.
- Theme loading and empty states as part of the board. Keep typography expressive in headings and readable in captions and form fields. Use CSS for pins, frames, and letter tiles. Use existing event imagery.

The affected surfaces are `app/page.tsx`, the event grid and cards, the event details and submission dialogs, and their calendar-scoped styles. The event backend, submission and moderation rules, routes, global navigation, and deployment are outside this phase. No new dependency is proposed.

## Risks and rollback

Texture, rotation, and paper colors can reduce contrast or cause overflow. Limit the texture behind text, keep rotation out of narrow layouts, and check labels, status colors, and visible focus against the paper palette. Roll back by reverting the calendar UI change.

## Acceptance and verification

- The board and title read clearly on desktop and mobile, including at narrow widths, with no horizontal overflow.
- Upcoming events retain their order, metadata, fallback artwork, and full-card mouse, keyboard, and touch activation.
- Event details and Add Your Event use the same palette. Verify dialog focus, dismiss behavior, image expansion, calendar and RSVP links, and the date, time, recurrence, and description controls.
- Run lint, type-check, and build. Review populated, empty, and loading states and representative desktop and mobile layouts. Record any browser checks that could not run.

## Approval

The user approved implementation after reviewing the documented proposal.

## Implementation and verification

The visual review requested darker, richer cork, a wider wood-grain frame, red, green, blue, white, black, pink, and yellow letter tiles, and the heading “Community Calendar.”

Follow-up feedback called for realistic material detail. The CSS gradient patterns were replaced with two optimized WebP assets derived from an image generated using the supplied Image A as a material reference. The cork repeats at a fixed scale, and the frame is sliced at the corners so the grain keeps its direction as the layout resizes.

After visual review, the frame was set to 4% of the viewport width within 11.5–56 px bounds. The title uses ivory lettering on a charcoal paper strip for contrast against the cork.

The calendar now uses photographic-style cork and wood assets, pinned letter tiles, instant-photo event cards, and scoped paper styling for event and submission dialogs. Lint, TypeScript during the Webpack production build, and whitespace checks passed. The local preview served the calendar heading, event cards, Add Your Event, and the approved frame and title styles. Independent mobile, keyboard, and touch checks remain pending.

Release `2dbe605` was pushed to `origin/main`. The canonical Vercel homepage served the new heading and Add Your Event, the production stylesheet contained the approved frame width and title colors, and both WebP textures returned successfully.

Production feedback led to a smaller “Community Calendar” subtitle and a standalone “Stooopid” main heading. Lint, TypeScript, and whitespace checks passed for the adjustment.

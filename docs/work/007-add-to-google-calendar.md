# Add to Google Calendar

- Status: Complete
- Date: 2026-10-27
- Source requirement: Add a button to each event-details modal that opens Google Calendar with the event information prefilled for the visitor to review and save.
- Approval: Approved by the user on 2026-10-27.
- Layout refinement: Approved by the user on 2026-10-27 to place the calendar action inside the date/time/place panel, right-aligned on wider screens and stacked on mobile.
- Visual refinement: Approved by the user on 2026-10-27 to replace the coral treatment with a minimal white background, black text, and rounded edges while preserving placement and behavior.

## Objective

Add a lightweight Google Calendar handoff to the existing event modal without introducing authentication, a backend integration, new dependencies, or changes to event data.

## Current-State Findings

- `EventDetails` already receives the complete `CommunityEvent`, including its title, description, start time, optional end time, Eastern timezone, venue, and optional address.
- The modal already groups its secondary actions for maps and sharing.
- Some events do not provide an end time.

## Proposed Approach

- Add an accessible **Add to Google Calendar** link in the event modal's action area.
- Generate a Google Calendar template URL from the event title, description, location, and start/end timestamps.
- Convert timestamps to Google Calendar's UTC date format so Eastern daylight-saving offsets remain accurate.
- When an event has no end time, use a one-hour default duration in the prefilled draft; the visitor can edit it before saving.
- Open Google Calendar in a new tab with safe external-link attributes.
- Do not show the action for cancelled or postponed events. Past events may still be added because the request applies to each valid event and calendar records can be useful historically.

## Scope

- `components/events/EventDetails.tsx`: render the calendar action.
- A small local utility under `lib/`: construct and encode the Google Calendar URL.

## Non-Goals

- Google OAuth, Calendar API writes, automatic saving, account detection, reminders, recurrence, attendee invitations, or changes to the Sheet schema.
- Changes to event cards, modal navigation, RSVP behavior, maps, sharing, or deployment configuration.

## Risks and Rollback

- Incorrect date conversion could shift the event time; verify known Eastern timestamps, including daylight-saving offsets.
- Events without an end time require an assumption; the proposed one-hour duration is editable in Google Calendar.
- Google may change its undocumented template URL behavior, although it is a widely used public handoff format.
- Rollback is limited to removing the link and URL helper.

## Acceptance Criteria

- A valid event modal offers an **Add to Google Calendar** action unless the event is cancelled or postponed.
- Activating it opens Google Calendar in a new tab with the title, description, location, start time, and end time prefilled.
- Eastern event times remain correct across standard and daylight-saving time.
- Events without an end time receive a one-hour default duration.
- Existing modal, RSVP, map, share, and image-viewer behavior remains unchanged.

## Verification Plan

- Check the generated URL for an event with an explicit end time and one without an end time.
- Run lint, TypeScript validation, and the production build.
- Review the complete diff for unintended changes.
- Manually confirm the Google Calendar draft in a browser if browser access is explicitly authorized.

## Actual Changes

- Added a reusable Google Calendar template URL generator using the existing event contract.
- Added **Add to Google Calendar** to the event modal's action row for valid, non-cancelled, non-postponed events.
- Prefilled the title, description, location, timezone, and UTC-normalized start/end timestamps.
- Applied a one-hour default duration when the source event has no end time.
- Kept the action as a safe new-tab handoff with no authentication, API writes, backend work, dependencies, or data-contract changes.
- Moved the calendar action into the date/time/place panel as approved: right-aligned on wider screens and stacked full-width beneath the details on mobile.
- Gave the compact prompt a restrained coral treatment while preserving the existing information hierarchy and secondary map/share actions.
- Replaced the coral prompt treatment with the approved minimal white background, black text, rounded corners, subtle shadow, and neutral hover state; the desktop label now stays on one line.

## Verification Evidence

- Confirmed a daylight-saving event with an explicit end produces `20261021T003000Z/20261021T023000Z`, preserving its 8:30–10:30 PM Eastern time.
- Confirmed an event without an end produces a one-hour range: `20261024T170000Z/20261024T180000Z`.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build -- --webpack`: passed, including framework TypeScript validation. The build used the expected local static-data fallback because production Google credentials are not stored locally.
- `git diff --check`: passed.
- Layout-refinement verification: lint, TypeScript validation, production build, and diff checks passed after the calendar action moved into the information panel.
- Visual-refinement verification: lint, TypeScript validation, production build, and diff checks passed after the button styling was simplified.

## Checks Not Performed

- Browser interaction and the final Google Calendar draft were not opened because browser access was not authorized for this task.
- Deployment was not performed because it was not requested.

## Residual Risk

- The Google Calendar template URL is a public handoff interface rather than a versioned API. Visitors must still review and save the draft, and Google may change the interface independently.

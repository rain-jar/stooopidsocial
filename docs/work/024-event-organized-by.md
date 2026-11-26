# 024 — Organized by / Shared by on event cards

## Request

Each homepage calendar card should be able to show a short line naming who is behind the event (t72u–t78u, 26 Nov 2026, America/Toronto):

- **Organized by Run Crew** or **Organized by Skate Crew** for crew events, using the same fields as any other organized event
- **Organized by &lt;name&gt;** for an event a member hosts
- **Shared by &lt;name&gt;** for a third-party event a member is posting to the board

The "Add Your Event" form collects an optional name and a choice between **Organizing** and **Sharing**. There is no special crew type and no automatic "Les Stooopids" label. Approved in chat, including t77u and the shorter t78u labels.

The live calendar already reads from Supabase.

## Fields

On `public.events`:

- `organizer_type text null` — `'member'` or `'shared'`
- `organizer_name text null` — first name, nickname, or a crew name such as "Run Crew", max 40 characters

Both must be null, or both must be set. Recurring events store this once on the parent row. Anon is granted `SELECT` on the two columns. Public submissions already insert through `service_role`, so no new anon insert grant is needed.

SQL (not applied): `supabase/migrations/202611260001_event_organizer.sql`.

## Form UX

On "Add Your Event":

- An optional **Your name** field, placeholder "First name or nickname".
- A choice between **Organizing** and **Sharing**. The choice only matters if a name is given; it defaults to Organizing.
- If the name is left blank, both columns stay null and the card has no attribution line.

The admin form at `/links/manage/events` shows and edits the same two fields, so existing events (for example the Sunday run, with the name "Run Crew" and Organizing) can be backfilled.

## Display

- On the card, a single optional line under the title and above the date/time, in the existing small stone-colored meta style.
- In the details dialog, the same wording under the title.
- `member` → `Organized by {name}`; `shared` → `Shared by {name}`. Omit the line when there is no name.

## Privacy

Collect a first name, nickname, or a short crew name only. Cap the field at 40 characters. Submitted names stay pending until an admin approves the event.

## Resilience

Event reads and submissions fall back if the new columns are not in the database yet, so the board does not break if the code is deployed before the migration. Attribution simply stays hidden until the columns exist and are backfilled.

## Rollout

1. Raj applies `supabase/migrations/202611260001_event_organizer.sql` in the Supabase SQL editor for the production project. The app does not auto-run migrations. This should happen **before** the code deploy.
2. After a separate explicit approval, push, merge, and deploy the code.
3. In `/links/manage/events`, backfill crew events (name "Run Crew" or "Skate Crew", Organizing) and any known member events. Older events can stay unlabeled.

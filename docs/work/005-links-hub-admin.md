# Self-Hosted Links Hub and Admin

- Status: In progress — protected preview verified; awaiting user preview approval and production promotion
- Date: 2026-10-24
- Source requirements: Replace the external `linktr.ee/stooopidruncrew` page with a faithful self-hosted `/links` page and a passcode-protected `/links/manage` interface backed by Supabase PostgreSQL.
- Approval: Approved by the user on 2026-10-24, including the Supabase dependency, isolated architecture, schema/RLS/functions, server-only authentication controls, reference asset download, and restrained rounded-button treatment.

## Objective

Provide a mobile-first public links page that preserves the current Stooopid Run Crew Linktree content and visual identity. Allow nontechnical admins sharing one passcode to manage categories and links without code changes or redeployment, while keeping all privileged operations server-side.

## Verified Current State

- The repository uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, npm, and Vercel.
- There is no existing database, user authentication, shared form system, or test framework.
- Existing visual language is dark, minimal, rounded, responsive, and uses shared `Header` and `Footer` components.
- Existing server integrations use server-only modules, strict validation, sanitized errors, and environment variables.
- The working tree is clean on `main`, synchronized with GitHub.
- Existing homepage, event pipeline, `/run`, Vercel OIDC, metadata, and deployment behavior must remain unchanged.

## Verified Reference Content and Design

The public Linktree was inspected read-only on 2026-10-24.

### Profile

- Name: `Stooopid Run Crew`
- Description:
  - `Home of the Stooopid Crew.`
  - `Sundays - 10 AM @ Café Tranquille.`
  - `Be good. Be kind. Be stooopid.`
- Social icons:
  - Instagram: `https://instagram.com/stooopidcrew`
  - Email: `mailto:lesstooopids@gmail.com`
- Circular crew avatar, approximately 96px.

### Grouped links and order

1. `Our Socials`
   1. `Instagram` → `https://www.instagram.com/stooopidcrew`
   2. `Stooopid Crew | Strava` → `https://www.strava.com/clubs/2391274`
2. `Community Links`
   1. `Donate to Help Yagil Through His Fight Against Glioblastoma, organized by Amine Labidi` → the current GoFundMe URL from the reference

### Visual treatment

- Flat navy background: `#1B3F72`
- Orange text/icons: `#EF9F27`
- White link surfaces with black text
- Centered, narrow mobile-first column
- IBM Plex Sans-like typography, compact vertical rhythm, centered profile header
- Linktree branding, promotions, consent UI, share controls, ads, and platform-specific account UI are excluded.

The task explicitly requests rounded link buttons even though the current reference theme reports square corners. The proposal follows the explicit requirement with restrained rounding consistent with the existing site.

## Proposed Architecture

### Public `/links`

- Add route-specific metadata and a server-rendered page; do not make the content editor or database client part of the browser bundle.
- Fetch visible categories and links from Supabase on every request or with explicit no-store behavior so published changes appear without a deployment.
- Render categories in admin-defined order and links within each category by `sort_order`.
- Render the verified profile, logo, social shortcuts, headings, and button hierarchy in a dedicated links-page layout.
- Open HTTP(S) links in a new tab with safe `rel` attributes. Treat email as a deliberate social shortcut rather than a database-managed general link.
- Provide accessible focus states, semantic headings, sufficient contrast, readable long-title wrapping, and touch targets of at least 44px.
- Show a compact safe unavailable state if Supabase cannot be reached; do not invent links or expose diagnostics.

### Admin `/links/manage`

- Server-render the management page after validating the session cookie.
- Provide a passcode login view, logout, category management, and simple link forms.
- Support add, edit, delete with confirmation, publish/hide, category assignment, and up/down ordering.
- Use ordinary forms and server-side route handlers/server actions so JavaScript enhancement is optional and the interface stays simple.
- Validate all fields again on the server and return field-level errors without leaking database details.
- Use transactions/RPC functions for ordering operations so duplicate or partial order states are avoided.

### Supabase data model

`link_categories`:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug text not null unique`
- `sort_order integer not null`
- `is_visible boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`links`:

- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `url text not null`
- `icon text null`
- `category_id uuid not null references link_categories(id)`
- `sort_order integer not null`
- `is_visible boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

The migration will add length/check constraints, order indexes, updated-at triggers, and an atomic reorder function. Initial rows will reproduce the verified Linktree categories, titles, destinations, visibility, and ordering exactly.

### RLS and database access

- Enable Row Level Security on both tables.
- Grant the anonymous role `SELECT` only for visible categories and visible links belonging to visible categories.
- Define no anonymous insert, update, or delete policies.
- Use the Supabase service-role key only in server-only admin code after application-session validation.
- Do not expose the service-role key, shared passcode, or session secret through `NEXT_PUBLIC_` variables, props, errors, logs, or client bundles.
- Use the official `@supabase/supabase-js` dependency rather than handwritten REST/auth behavior.

### Shared-passcode authentication

- Store a slow password hash in `LINKS_ADMIN_PASSCODE_HASH`, not the plaintext passcode.
- Store an independent high-entropy `LINKS_ADMIN_SESSION_SECRET` for signed session and CSRF tokens.
- On successful server-side verification, issue a signed, time-limited HttpOnly cookie with `Secure` in production, `SameSite=Strict`, path restricted to `/links/manage`, and a practical expiry (proposed: 8 hours).
- Validate signature and expiry for every admin page and every mutation.
- Logout clears the cookie server-side.
- Protect mutations with both strict Origin/Host validation and a session-bound CSRF token submitted with each form.
- Use constant-time comparisons for authentication and token verification.

### Login rate limiting

- Add a private `links_admin_login_limits` table that is inaccessible to anonymous clients.
- Store only a keyed hash of the requesting IP/user-agent bucket, attempt count, window start, and lock expiry; never store raw IP addresses.
- Use an atomic database function to enforce a small rolling limit and escalating temporary lockout.
- Reset the relevant bucket after successful authentication and periodically remove expired records.
- Fail closed if the rate-limit check cannot be completed.

This uses the existing Supabase database rather than process memory, which is unreliable across Vercel serverless instances, and avoids a paid third-party rate-limiting service.

## Dependencies and Configuration

### Proposed dependency

- Add `@supabase/supabase-js` as the only new runtime dependency.

### Required Vercel variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LINKS_ADMIN_PASSCODE_HASH`
- `LINKS_ADMIN_SESSION_SECRET`
- `LINKS_ADMIN_RATE_LIMIT_SECRET`

All variables are server-only. None will use the `NEXT_PUBLIC_` prefix.

## Assets

- Preserve the current crew avatar by downloading the verified reference asset into `public/links/` after approval, avoiding a permanent runtime dependency on Linktree's CDN.
- Reuse recognizable local or text-based icons without adding an icon library. Admin-entered icons will be restricted to a short safe text/emoji value or an approved token; raw SVG/HTML will never be rendered.
- Do not copy Linktree trademarks, platform branding, ads, or promotional assets.

## Affected Areas

- `package.json`, `package-lock.json`
- `app/links/page.tsx` and route metadata
- `app/links/manage/` pages and protected handlers/actions
- `components/links/` public and admin components
- `lib/links/` Supabase, validation, auth, CSRF, rate-limit, and repository modules
- `supabase/migrations/` schema/RLS/functions/seed migration
- `public/links/` approved local profile asset
- Deployment documentation and environment configuration

Existing homepage, event components/data pipeline, `/run`, shared layout components, and global design tokens will not be substantially rewritten.

## Non-Goals

- Individual accounts, signup, password reset, roles, or audit dashboards
- Link analytics, click tracking, scheduling, QR generation, file uploads, or image hosting
- Drag-and-drop reordering
- Rich text, custom HTML/SVG, arbitrary scripts, or Linktree platform features
- Modifying unrelated navigation until separately requested
- Replacing Vercel, Google event data, or the current site-wide design system

## Security Impact

### New trust boundaries

- Public browser → public server render → Supabase anonymous read policy
- Admin browser → passcode/session/CSRF boundary → server-only privileged Supabase client
- Vercel secrets → server runtime only

### Threats and mitigations

- **Passcode guessing:** slow password hash, persistent database rate limit, temporary lockout, generic failure responses, and no account enumeration.
- **Session theft/tampering:** signed short-lived HttpOnly, Secure, SameSite=Strict cookie; constant-time verification; logout and expiry.
- **CSRF:** SameSite cookie, exact Origin/Host validation, and session-bound CSRF token for every mutation.
- **Unauthorized direct Supabase writes:** RLS enabled, no anonymous write policies, service role never sent to the browser.
- **XSS/malicious content:** React text rendering, strict lengths, HTTP(S)-only managed URLs, no raw HTML/SVG, and bounded icon text.
- **Open redirects/unsafe destinations:** parse with `URL`, permit only `https:`/`http:` for managed links, and add safe new-tab attributes.
- **Race conditions/order corruption:** database transaction/RPC reorder operations and uniqueness/index constraints.
- **Secret leakage:** server-only modules, non-public variable names, sanitized errors, tracked-file scans, and bundle/markup inspection.
- **Abusive requests/resource exhaustion:** bounded payload sizes, field lengths, rate limiting, and server-side validation.

### Exposure and impact

If the shared passcode is disclosed, an attacker could modify public links, potentially sending visitors to malicious destinations. If the service-role key is disclosed, broader Supabase access may be possible. The implementation therefore treats all admin mutations and secrets as high-impact boundaries. Shared credentials also prevent per-admin attribution and selective revocation; changing the passcode invalidates future logins but existing sessions remain valid until expiry unless the session secret is rotated.

### Compatibility, rollout, monitoring, and rollback

- New routes and tables are additive; existing routes remain untouched.
- Deploy schema/RLS first, verify anonymous read/write denial, then configure Vercel secrets and deploy a protected preview.
- Log only sanitized authentication outcome classes and database errors; never log passcodes, tokens, raw IPs, service keys, or submitted link values.
- Monitor failed logins, denied writes, database errors, and unexpected redirect destinations without collecting unnecessary personal data.
- Rollback by removing the new routes and dependency, then dropping the isolated tables/functions only after export or confirmation. Existing pages and Google resources are unaffected.

### Residual risk

- One shared passcode offers no per-admin auditability or selective access removal.
- A malicious authenticated admin can intentionally publish a harmful link.
- Supabase availability becomes a dependency for `/links`; failures will use a safe unavailable state.
- Public destinations can change behavior after validation.

## Acceptance Criteria

- `/links` faithfully reproduces the verified profile, grouping, link order, colors, logo, and destinations without Linktree branding.
- The page is responsive, keyboard accessible, and optimized for mobile sharing.
- Only visible categories and links appear publicly, in stored order.
- `/links/manage` requires the shared passcode and supports category/link create, edit, delete, reorder, assignment, and visibility changes.
- Changes appear publicly without code changes or redeployment.
- Direct anonymous Supabase insert/update/delete attempts fail.
- Every privileged operation verifies session, CSRF, input, and destination protocol server-side.
- Login rate limiting, expiry, logout, secure cookie settings, and generic failures work as documented.
- No secrets or privileged database credentials enter client bundles, rendered markup, logs, tracked files, or browser-readable storage.
- Existing homepage, event pipeline, `/run`, metadata, and deployment behavior remain intact.

## Verification Plan

- Apply migration to a development/preview Supabase project or isolated schema and verify constraints, seed data, RLS, and reorder transactions.
- Test anonymous visible reads and denied hidden reads/writes directly against Supabase.
- Test valid login, invalid login, throttling/lockout, cookie flags, expiry, logout, CSRF failure, bad Origin, and tampered sessions.
- Test every category and link mutation, including invalid/oversized titles, unsafe URLs, duplicate order positions, hidden categories, and deletion confirmation.
- Verify immediate public changes without redeployment.
- Verify missing/empty/database-error states.
- Inspect desktop and mobile layouts, long labels, focus states, keyboard operation, contrast, and external-link behavior.
- Inspect rendered output and client bundles for secrets.
- Run `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm audit --omit=dev`, and `git diff --check`.
- Deploy a protected Vercel preview, repeat live Supabase/auth checks, then request approval before production promotion.

## Required User Inputs After Approval

- Supabase project URL, anonymous key, and service-role key, entered directly into local/Vercel secret storage rather than chat or documentation.
- The desired shared admin passcode, entered only through a local hash-generation step; the plaintext passcode will not be stored or shared.
- Confirmation that restrained rounded link buttons should take precedence over the reference's square-corner theme.

## Implemented Changes

- Added the dynamic, server-rendered `/links` page with the approved profile, locally stored avatar, social shortcuts, grouped database links, accessible interaction states, empty state, and safe unavailable state.
- Added `/links/manage` with passcode login, logout, category and link create/edit/delete, publish controls, category assignment, and up/down ordering.
- Added server-only Supabase clients, repositories, strict form validation, protocol validation, signed sessions, CSRF protection, exact-origin checks, bounded request sizes, and persistent database-backed login throttling.
- Added the isolated migration with schema constraints, RLS, visible-read-only anonymous policies, private rate-limit storage, atomic reorder functions, triggers, grants, and the verified seed content.
- Added a corrective follow-up migration that explicitly grants the Supabase `service_role` access to the isolated tables; live verification showed that the new secret-key model did not inherit these table grants automatically.
- Added a local masked passcode-hash generator and the approved `@supabase/supabase-js` runtime dependency.

## Configuration and Rollout Steps

1. Create a Supabase project on the free plan. In its SQL Editor, run `supabase/migrations/202610240001_links_hub.sql` once. If the initial migration was applied before the service-role grant correction, also run `supabase/migrations/202610240002_links_service_role_grants.sql` once.
2. In the Supabase Connect dialog, copy the project URL. In Project Settings → API Keys, use the current publishable key and secret key. Store them locally in `.env.local` as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` respectively. The variable names are retained by this app, but the values use Supabase's current key model. Never paste the secret key into chat or commit it.
3. Run `npm run hash:links-passcode`, enter the shared passcode at the masked prompt, and store only the resulting hash as `LINKS_ADMIN_PASSCODE_HASH`.
4. Generate two separate high-entropy values (for example, `openssl rand -base64 48` twice) and store them as `LINKS_ADMIN_SESSION_SECRET` and `LINKS_ADMIN_RATE_LIMIT_SECRET`.
5. Repeat the six variables in the protected Vercel Preview environment. Confirm the Vercel Node.js runtime is version 22 or newer, as required by the installed Supabase client.
6. Verify the preview according to this record before adding the same values to Production or promoting the deployment.

## Verification Evidence to Date

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npx next build --webpack`: passed; all new routes were emitted as dynamic. The normal Turbopack build could not run in the restricted local sandbox because its CSS worker attempted to bind a local port; this is an environment limitation, not an application diagnostic.
- `git diff --check`: passed.
- `npm audit --omit=dev`: the new Supabase packages introduced no reported advisory. The scan still reports the existing high-severity Zod denial-of-service advisory through `@vercel/oidc`/`@vercel/cli-config`; npm currently proposes a major-version downgrade to `@vercel/oidc@3.5.0`, so this was not changed as unrelated security scope without compatibility review.
- Live Supabase verification: the anonymous client read exactly two seeded categories and three seeded links; an anonymous insert was denied; the anonymous role could not execute the private rate-limit RPC; and the secret-key client could read the admin data and execute the rate-limit check after the explicit service-role grants were applied.
- Local configured HTTP verification: `/links`, `/links/manage`, and the profile asset returned 200; the public output contained the verified groups and link labels; the admin login form rendered; and an origin-less login POST was rejected with 403 before passcode evaluation.
- Configuration-shape checks passed without printing values: current Supabase publishable/secret key formats, passcode-hash format and iteration floor, and minimum session/rate-limit secret lengths.
- The user successfully verified the configured local public page and passcode-protected admin experience on 2026-10-24.
- Protected Vercel Preview `dpl_6NxnaSYEd9P5zMPSQzbgkssLYd3Y` deployed successfully. Vercel reported `READY` with `vercel_authentication` protection; an unauthenticated request redirected to Vercel SSO. Authenticated CLI checks returned the public profile, all seeded groups/labels, admin login form, and valid local avatar asset.
- Independent session-cookie flag inspection, exhaustive mutation workflows, rate-limit lockout, supported-browser checks, and user preview approval remain pending. No claim of completed security verification is made yet.

## Approval Request

Approval authorizes the isolated `/links` and `/links/manage` architecture, addition of `@supabase/supabase-js`, the proposed Supabase schema/RLS/functions, server-only shared-passcode/session/CSRF/rate-limit implementation, local reference asset download, and incremental implementation/testing. It does not authorize production migration, Vercel secret changes, Git push, or deployment until the preview has been reviewed.

# ADR-001: Supabase as the Event Platform

- Status: Accepted
- Date: 2026-11-06
- Approval: Approved by the user on 2026-11-06.

## Context

The calendar currently reads approved event records from a restricted Google Sheet and proxies images from restricted Google Drive through Vercel. That workflow is safe for editor-managed content but cannot support public event submissions without either giving contributors access to the Sheet or building a second write system.

The application already uses Supabase Postgres, Row Level Security, Storage-capable tooling, a server-only service-role client, and an authenticated administration area for the links hub.

## Decision

Use the existing Supabase project as the sole event database and image store.

- Public visitors submit events through the website without receiving database credentials or direct database write access.
- New records enter a `pending` moderation state and remain non-public until an administrator approves them.
- Approved records are publicly readable through a narrow Row Level Security policy.
- Event images remain in a private bucket and are served through an authorization-aware same-origin route only for approved events.
- The existing `/links/manage` authentication boundary will protect a dedicated event moderation page under `/links/manage/events`.
- Google Sheets and Drive remain available during migration and rollback, then are removed from the runtime after verified cutover.

## Rationale

This reuses infrastructure and security patterns already present in the repository, eliminates duplicate editorial work, supports moderation, avoids public database writes, and keeps event data and images in one operational system. A custom database, headless CMS, or writable Google integration would add more authentication, permission, and maintenance surface for less immediate value.

## Consequences

- A database and Storage migration becomes part of deployment.
- Public submission abuse must be mitigated with strict server validation, rate limiting, anti-automation controls, bounded uploads, and moderation.
- Supabase becomes the calendar's availability dependency, mitigated by caching and a controlled migration rollback window.
- Google credentials and APIs can be removed after parity is verified, reducing secrets and external dependencies.
- Administrators continue using the existing passcode-based management boundary; stronger administrator identity remains a possible future hardening step.

## Alternatives Considered

- **Keep Google Sheets and write submissions into it:** preserves the editor interface but requires privileged Google write access in the application, complicates image handling, and expands the impact of credential compromise.
- **Run Google and Supabase permanently in parallel:** lowers immediate migration pressure but creates duplicate truth, conflict handling, and operational ambiguity.
- **Add a separate CMS:** offers editorial features but adds a platform, dependency, cost, and migration without improving the MVP submission flow enough to justify it.
- **Allow anonymous browser writes directly to Supabase:** fewer server endpoints, but exposes the write contract and is harder to defend against spam, malformed data, and upload abuse.

## Reversal

During the migration window, restore the Google repository in `app/page.tsx` and the current Drive image route. After Google access is removed, reversal requires restoring its Vercel/Google configuration and redeploying the previous revision.

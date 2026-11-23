# SEC-2026-002: Next.js Moderate Advisories

## Status

Open — observed during verification on 2026-11-23. No remediation has been applied or claimed.

## Summary

`npm audit --omit=dev` reports that the installed production dependency Next.js 16.4.2 is affected by a set of published moderate-severity advisories. The audit recommends upgrading to a patched Next.js release and currently identifies 16.4.6 as the available fix. The application build also emits the corresponding security-upgrade reminder.

This finding predates and is independent of the recurring-event, time-entry, and formatted-description implementation. Dependency changes require separate explicit approval under repository policy.

## Affected Components and Exposure

- Dependency: Next.js 16.4.2
- Deployment surface: Vercel-hosted Next.js application
- Relevant application surfaces: cached approved-event reads, server-rendered routes, route handlers, image rendering, and authenticated management pages
- Supported browsers: latest two stable Chrome, Safari, Firefox, and Edge releases

The published advisories cover multiple caching, response-handling, image, and runtime behaviors. Application-specific exploitability has not been established. Several reported conditions appear to have reduced direct exposure here because event uploads exclude SVG, route handlers use the Node.js runtime rather than Edge, the current deployment is Vercel rather than a custom self-host, and the application does not intentionally enable Cache Components. The use of `unstable_cache` for approved public events means cache-related advisories still warrant timely remediation and regression testing.

## Severity Rationale and Potential Impact

Severity is recorded as moderate, matching the package audit. A successful applicable issue could disclose or poison cached responses, expose response data across requests, or bypass expected image/runtime handling. Pending events and administrator data are protected by separate Supabase RLS, server-only queries, authentication, and uncached management routes, but those controls do not justify leaving a known affected framework version indefinitely.

## Recommended Remediation

1. In a separate approved security phase, run the Next.js security upgrade workflow or explicitly update Next.js and its matched ESLint configuration to a patched compatible release.
2. Review the resulting dependency and lockfile diff; do not accept unrelated major-version changes.
3. Run lint, type-check, production build, focused cache/image/authentication tests, and both production and full dependency audits.
4. Deploy to a protected preview and verify public events, private images, submissions, and management authentication before production promotion.

Alternatives are to apply a vendor-supported targeted patch if one becomes available or temporarily reduce affected framework behavior. Remaining on 16.4.2 is not the recommended long-term option.

## Compatibility, Rollout, and Rollback

The audit currently identifies Next.js 16.4.6 as the remediation target, which is outside the repository's exact `16.4.2` version declaration. The upgrade may alter framework output or matched tooling behavior and therefore requires the normal dependency-change approval and preview verification.

Roll out through a protected preview. Roll back the dependency and lockfile commit if functional regression occurs, while treating the advisory as open and reassessing mitigations rather than marking it resolved.

## Verification Required Before Closure

- `npm audit --omit=dev` no longer reports the Next.js production advisory.
- Full `npm audit` results and development-only residual findings are recorded separately.
- `npm run lint`, `npx tsc --noEmit`, and the production build pass.
- Public cached events do not cross-contaminate responses or expose pending data.
- Private image delivery still accepts only approved image records and expected MIME types.
- Authenticated management cookies, routes, CSRF checks, and redirects behave as expected.
- A protected preview passes representative desktop/mobile smoke testing before production deployment.

## Disclosure and Residual Risk

The advisories are already public; this record contains no credentials, private data, active exploitation details, or unpublished vulnerability information. Until a patched version is verified and deployed, the production dependency risk remains open.

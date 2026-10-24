# SEC-2026-001: Dependency Vulnerabilities

- Status: Original findings remediated; new Vercel OIDC transitive advisory under review
- Date: 2026-10-21
- Disclosure status: Internal repository record; no external disclosure performed

## Summary

Next.js 16.1.1 and several transitive dependencies had known security advisories. The runtime dependency was updated to Next.js 16.4.2, with eslint-config-next kept at the matching version. Compatible transitive packages were refreshed in the lockfile.

## Exposure and Impact

The affected deployment surface was the Next.js application serving `/` and `/run`, including framework request handling and image, cache, and server-component functionality where enabled. The site currently has no application API layer or authentication boundary. Supported browsers are the latest two stable versions of Chrome, Safari, Firefox, and Edge; the deployment target is Vercel.

Potential impacts in the advisories included remote code execution under affected configurations, denial of service, server-side request forgery, cache poisoning, information disclosure, and cross-site scripting. Actual exploitability was configuration- and platform-dependent. No evidence of exploitation was identified during this dependency review.

## Remediation

- Updated `next` from 16.1.1 to 16.4.2.
- Updated `eslint-config-next` from 16.1.1 to 16.4.2.
- Refreshed compatible transitive packages, including patched PostCSS, Sharp, Nanoid, source-map, and browser-mapping versions.
- Made no application-code, route, browser-support, authentication, data, infrastructure, or deployment changes.

The alternative of retaining the old versions was rejected because it preserved known runtime risk. npm's proposed forced downgrade of eslint-config-next to 14.2.35 was rejected as incompatible with Next.js 16.

## Verification

- Production audit: zero known vulnerabilities.
- ESLint: passed.
- Next.js 16.4.2 webpack production build: passed, including static generation of `/` and `/run`.
- Default Turbopack verification was blocked by a local port-binding restriction in the execution environment, not by a reported application compilation error.

## Residual Risk

The five development-only ESLint findings recorded on 2026-10-21 were no longer reported by the 2026-10-24 audit. The production OIDC finding below is the current known dependency risk.

### 2026-10-24 advisory update

During verification for the links-hub phase, `npm audit --omit=dev` reported GHSA-mrhx-c7xc-m3w5 in Zod versions below 4.6.6. The affected Zod copy is transitive through the production dependencies `@vercel/oidc@4.0.3` and `@vercel/cli-config`. The upstream rating is high (availability impact through memory exhaustion when validating oversized constrained collections). In this application the package is used to consume Vercel-provided OIDC/configuration data rather than public user submissions, so realistic external exposure appears limited, but it has not been proven unreachable.

npm currently offers only a major-version downgrade to `@vercel/oidc@3.5.0`; no in-family patched update is offered. That downgrade was not applied during the unrelated links feature because it could alter the production Google Workload Identity authentication path. A focused compatibility review and protected-preview verification are required before remediation. Until then, keep Vercel environment/configuration input trusted and bounded, monitor `@vercel/oidc` releases, and rerun the production audit. No exploit evidence was observed, no disclosure was made, and no credentials or exploit details are recorded here.

## Rollout, Monitoring, and Rollback

No deployment was performed for the original remediation. CI or deployment should repeat a clean install, production audit, lint, and build. Continue automated or periodic advisory monitoring. Reverting the original lockfile would reintroduce the remediated framework vulnerabilities and is not an acceptable long-term rollback; prefer a newer compatible patch if regression handling is required. For the 2026-10-24 OIDC finding, rollback is not applicable because no dependency change was made.

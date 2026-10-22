# SEC-2026-001: Dependency Vulnerabilities

- Status: Remediated for production; development-tooling risk accepted pending upstream fix
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

Five high-severity audit findings remain in the development-only ESLint dependency chain. They are not part of the deployed production dependency tree and currently have no compatible upstream remediation. Limit linting to trusted repository input, monitor upstream releases, and apply a compatible patch when available.

## Rollout, Monitoring, and Rollback

No deployment was performed. CI or deployment should repeat a clean install, production audit, lint, and build. Continue automated or periodic advisory monitoring. Reverting the lockfile would reintroduce known runtime vulnerabilities and is not an acceptable long-term rollback; prefer a newer compatible patch if regression handling is required.

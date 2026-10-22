# Dependency Security Update

- Status: Complete
- Date: 2026-10-21
- Source requirements: Update vulnerable dependencies without changing application behavior or application code.

## Objective

Remove known vulnerabilities from the production dependency tree while preserving the existing site.

## Current-State Findings

The project used Next.js 16.1.1 and eslint-config-next 16.1.1. The production audit reported six vulnerable packages: one critical, four high, and one moderate. Findings included Next.js and its transitive PostCSS, Sharp, Nanoid, source-map, and browser-mapping dependencies.

## Scope

- Update Next.js and its matching ESLint configuration.
- Refresh transitive dependencies through the npm lockfile.
- Verify the production audit, lint, type checking through the build, and production compilation.

## Non-Goals

- No application, design, routing, content, deployment, or infrastructure changes.
- No forced downgrade of lint tooling to satisfy development-only audit findings.
- No deployment.

## Approach and Affected Components

Next.js and eslint-config-next were updated from 16.1.1 to 16.4.2. npm applied compatible transitive security updates. Only `package.json` and `package-lock.json` changed for the remediation.

Affected surfaces are dependency installation, local linting, builds, and the Next.js runtime serving `/` and `/run`. There are no application APIs or authentication boundaries.

## Security Impact

The vulnerable Next.js runtime included critical and high-severity advisories involving remote code execution, denial of service, request handling, cache behavior, and server-side request forgery under affected configurations. Transitive PostCSS, Sharp, Nanoid, source-map, and browser-mapping versions also had known findings. Realistic exposure depended on deployment platform, operating system, and use of affected Next.js features; the public site nevertheless carried an avoidable vulnerable runtime dependency.

Updating to Next.js 16.4.2 brought patched runtime and transitive versions without a major-version migration. The production audit now reports zero known vulnerabilities. No application data, authentication, API contract, route behavior, or browser target changed.

The full audit retains five high-severity findings confined to the development-only Next.js ESLint dependency chain. No compatible upstream fix is currently available; npm proposes an incompatible downgrade to eslint-config-next 14.2.35. Exposure is limited to running lint tooling against malicious or untrusted input. The project should keep lint input trusted and update when a compatible upstream release is available.

No exploit details, credentials, personal data, or active-exposure claims are recorded here. No public disclosure or deployment was performed.

See `docs/security/SEC-2026-001-dependency-vulnerabilities.md` for the dedicated security record.

## Risks and Rollback

The patch-version upgrade could introduce framework regressions. Rollback is possible by reverting `package.json` and `package-lock.json`, but doing so would restore known vulnerabilities and should be used only as a short-lived emergency measure. A safer response to a regression is upgrading to a later patched compatible release.

## Acceptance Criteria

- Production dependency audit reports no known vulnerabilities.
- Lint passes.
- A production build completes.
- No application source files change.

## Verification

- `npm audit --omit=dev`: passed with zero vulnerabilities.
- `npm run lint`: passed.
- `npm run build -- --webpack`: passed; `/` and `/run` were statically generated.
- Default Turbopack build could not be verified in the restricted execution environment because its helper process was not permitted to bind a local port. The webpack production build completed successfully.
- Diff review confirmed that only dependency manifests changed for the remediation; the pre-existing untracked `app/run/` directory was preserved.

## Rollout and Monitoring

Deployment was not requested or performed. Before deployment, run `npm ci`, the production audit, lint, and the production build in CI. Continue monitoring npm advisories and upgrade the ESLint dependency chain when a compatible patch becomes available.

## Outcome

All known production dependency vulnerabilities identified during the review were remediated. The residual development-only lint findings remain documented above.

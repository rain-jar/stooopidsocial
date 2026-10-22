# Vercel OIDC and Deployment

- Status: Complete
- Date: 2026-10-22
- Source requirements: Prepare and deploy the approved event website to the existing Vercel project while replacing the long-lived Google service-account key with Vercel OIDC and Google Workload Identity Federation.
- Approval: Approved by the user on 2026-10-22. Deleting the existing JSON key requires a final confirmation after the OIDC deployment has been verified.

## Objective

Deploy the current site through a protected Vercel preview, verify the Google Sheets and restricted Drive image pipeline with short-lived credentials, then release the verified build to production. Remove the long-lived Google private key from production configuration and revoke it only after successful validation.

## Current-State Findings

- The application is linked locally to an existing Vercel project and the repository remote is GitHub.
- The current branch is `main` and contains uncommitted approved feature work plus user copy changes that must remain intact.
- The Google integration currently authenticates with a long-lived service-account JSON key stored only in ignored `.env.local`.
- `google-auth-library` is already installed; `@vercel/oidc` and the Vercel CLI are not installed in the project.
- The service account reads only the explicitly shared Sheet and Drive folder; it has no project-level data role.
- Vercel supports short-lived OIDC credentials for builds and functions. Google supports exchanging those credentials through Workload Identity Federation and service-account impersonation.
- The production site is intended to be public. Standard Deployment Protection can protect preview and generated deployment URLs while leaving the production domain public.

## Proposed Approach

### Application authentication

- Add the official `@vercel/oidc` runtime dependency.
- Update the server-only Google authentication module to use a Google external-account client when all Workload Identity Federation variables are present.
- Restrict the federated client to the existing read-only Sheets and Drive scopes.
- Retain the current private-key path only as an explicit local-development fallback during transition; do not configure the private key in Vercel.
- Fail closed on incomplete federated configuration rather than silently switching authentication modes in a deployment.

### Google Cloud configuration

- Create a dedicated Workload Identity Pool and OIDC provider using Vercel's recommended team-scoped issuer and team audience.
- Map `google.subject` to Vercel's signed `sub` claim.
- Grant `roles/iam.workloadIdentityUser` on the existing service account only to the exact Vercel subject for this project and environment.
- Configure separate exact principals for `preview` and `production`; do not trust the whole pool, another project, or development tokens by default.
- Preserve the service account's existing resource-level Viewer shares and do not add project-level Google data roles.

### Vercel configuration

- Enable the team-scoped OIDC issuer.
- Add only non-secret identifiers required by the event pipeline and federation: Sheet range/ID, Drive folder ID, Google project number, service-account email, pool ID, and provider ID.
- Do not upload `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` to Vercel.
- Enable Standard Deployment Protection for preview and generated deployment URLs, while keeping the production domain public.
- Apply configuration to preview first, then production after verification.

### Release sequence

1. Make and verify the code change locally while preserving the existing local fallback credential.
2. Configure the narrowly scoped Google federation and Vercel environment variables.
3. Create a Git branch and commit only the intended site, documentation, and lockfile changes; never commit `.env.local`.
4. Push the branch to create a Vercel preview deployment.
5. Verify the homepage, Sheet-backed events, restricted Drive images, fallback states, modal behavior, `/run`, and absence of credentials in client output.
6. Promote the verified deployment to production using the project's existing Vercel workflow.
7. After production verification and separate final confirmation, disable and delete the old Google service-account JSON key, remove its local private-key value, and retest.

The rollback point remains available until step 7. Key revocation will not occur merely because this proposal is approved.

## Affected Areas

- `package.json` and `package-lock.json`: official Vercel OIDC helper dependency
- `lib/google-auth.ts`: federated authentication with local-development fallback
- Vercel project Security, Deployment Protection, and environment-variable settings
- Google Cloud Workload Identity Federation and the existing service account's impersonation policy
- GitHub branch and Vercel preview/production deployments
- This phase record and the existing event-pipeline record

## Non-Goals

- Changing event data, event UI, routing, caching, or the Google Sheet contract
- Making the Google Sheet or Drive folder public
- Adding application user authentication
- Granting Google write access or broad project roles
- Making the production website private
- Rotating or revoking the existing key before the federated production path is proven

## Security Impact

### Weakness and severity rationale

The current service-account private key is a persistent credential. If copied from a workstation or future deployment configuration, it could be used until revoked to read every resource shared with that account. The present scope is limited, but unpublished event data and restricted source images could be exposed. This is treated as a high-priority pre-deployment hardening issue because internet deployment increases operational exposure even though no credential currently reaches the browser or repository.

### Affected surfaces and boundaries

- Server-rendered homepage and the dynamic event-image route
- Google Sheets and Drive APIs
- Vercel preview and production functions/builds
- The existing Google service account and resources shared with it
- Latest two stable versions of Chrome, Safari, Firefox, and Edge are presentation consumers only; no credential is delivered to them
- No end-user authentication boundary changes

### Remediation and alternatives

Use Vercel OIDC, Google Security Token Service, and service-account impersonation to exchange a short-lived, signed, project-and-environment-bound token. Limit federation to exact Vercel subjects and keep existing read-only OAuth scopes and resource shares.

Alternatives are retaining a Vercel secret containing the JSON key, manually rotating keys, or moving content to a different store. A Vercel secret would reduce accidental display but remain a persistent credential; rotation reduces lifetime but adds operational burden; changing storage expands scope and architecture. Federation is the narrowest durable fix.

### Compatibility and migration effects

- Production behavior and the event data contract remain unchanged.
- Authentication changes only in server code.
- Preview and production require valid federation configuration; incomplete configuration should surface as a server-side Google failure and use the existing static-event fallback rather than leak data.
- Local development may temporarily continue with the ignored key. A later local OIDC workflow can remove that fallback after deployment is stable.

### Security verification

- Confirm the preview and production Vercel subjects can impersonate only the intended service account.
- Confirm an untrusted environment or mismatched subject cannot impersonate it.
- Confirm Sheets/Drive access remains read-only and limited to explicitly shared resources.
- Inspect rendered markup and client bundles for private keys, OIDC tokens, Google access tokens, service-account internals, and direct Drive URLs.
- Confirm `.env.local` remains ignored and absent from the commit.
- Run production dependency audit after installing the helper.
- Verify preview protection and public production behavior from an unauthenticated browser session.

### Rollout, monitoring, and rollback

Roll out to preview before production. Monitor sanitized authentication/API failures, event fallback usage, and image failures without logging tokens, credential material, or private row content. If federation fails, restore the previous authentication code and temporarily supply the existing key only through a protected server-side secret; the key remains valid until explicit post-verification revocation.

### Disclosure and residual risk

No known credential leak or active exploitation has been identified, so no external disclosure is planned. Federation does not protect data intentionally rendered on the public site, and public event images remain downloadable. A compromised Vercel workload within the exact trusted project/environment could obtain short-lived access. Local fallback credentials remain a residual risk until the old key is revoked and removed.

## Risks

- A wrong issuer, audience, subject, project number, or IAM binding can break live event loading.
- Trusting a whole workload pool would grant unnecessarily broad impersonation access.
- Project or team renames change Vercel token claims and would require policy updates.
- Pushing the current dirty `main` work without careful staging could include unintended files.
- Revoking the JSON key too early would remove the immediate rollback path and could interrupt local development.

## Rollback

- Before key revocation: revert the authentication code and restore the key only in approved server-side secret storage.
- Before production promotion: discard the preview deployment and leave production unchanged.
- After production promotion but before revocation: redeploy the last known-good production build.
- After revocation: create a new narrowly scoped service-account key only as an emergency temporary measure, then correct federation and revoke the emergency key.

## Acceptance Criteria

- Preview and production load published Sheet events and approved restricted Drive images through federated credentials.
- No long-lived Google private key is configured in Vercel or included in tracked files, build output, markup, logs, or client bundles.
- Google impersonation is limited to the exact Vercel project and approved preview/production environments.
- The service account retains only read-only resource access.
- Preview/deployment URLs are protected and the intended production domain remains publicly accessible.
- Existing homepage, event cards/modal, URL behavior, fallback behavior, navigation, `/run`, and user copy remain intact.
- Lint, type-check, production build, production dependency audit, and focused runtime checks pass.
- The existing JSON key is revoked only after verified production success and explicit final confirmation.
- The complete diff contains no unintended files or secrets.

## Verification Plan

- Run `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` using the supported production build path.
- Run `npm audit --omit=dev` and review the full audit separately for previously documented development-only findings.
- Exercise successful, unavailable, invalid-row, missing-image, and invalid-image-route behavior locally.
- Test the protected preview from desktop and mobile widths, including keyboard focus, modal close behavior, direct event URLs, Sheet refresh, and restricted images.
- Inspect deployment logs only for sanitized failures and inspect client artifacts for secret leakage.
- Test production immediately after promotion, then repeat the Google data and image checks after key revocation.

## Open Approval Items

Approval of this phase authorizes adding `@vercel/oidc`, changing the server authentication path, configuring the described Google and Vercel security settings, creating and pushing a deployment branch, and deploying a protected preview. Production promotion will follow only after preview results are reported. Deleting the old JSON key remains a separate destructive step requiring explicit confirmation.

## Implementation Progress

- Added `@vercel/oidc` 4.0.3.
- Added server-only Google external-account authentication using the Vercel OIDC token, Google Security Token Service, and service-account impersonation.
- Vercel deployments require all federation identifiers and fail closed when configuration is incomplete; the private-key path remains available only outside Vercel for the temporary local-development transition.
- Kept the existing read-only Sheets and Drive OAuth scopes and resource-level access model.
- The user configured the team-scoped Vercel issuer, Google workload identity pool/provider, exact preview and production impersonation principals, non-secret Vercel variables, and Standard Deployment Protection.
- Confirmed that production is intentionally public and displayed event images may be downloaded by visitors.

### Verification to date

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build -- --webpack`: passed; restricted Google networking in the local sandbox exercised the existing static fallback during prerender.
- `npm audit --omit=dev`: zero vulnerabilities.
- `git diff --check`: passed.
- `.env.local` remains ignored, and a tracked-file scan found no private-key material.

### Final deployment evidence

- Pushed the implementation to `deploy/vercel-oidc` and created a protected Vercel preview.
- The first preview exposed an OIDC audience mismatch. Updated the token supplier to preserve Vercel's team audience; the corrected preview then loaded five published Sheet events without using the local fallback.
- Verified Standard Deployment Protection redirects unauthenticated preview requests and permits authenticated project checks.
- Verified a restricted Drive image returned HTTP 200 with `image/png`, `nosniff`, and bounded cache headers; an invalid image route returned HTTP 404.
- Verified `/run` returned HTTP 200 and rendered output contained no private key, OIDC token, Google access token, service-account email, direct Drive URL, or Google API hostname.
- Promoted the verified preview to production and confirmed the public production domain returned HTTP 200 with the same five Sheet-backed image routes.
- The user deleted the Google service-account JSON key and removed `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` from `.env.local`.
- After revocation, production continued to return the live Sheet-backed event set and an independently requested restricted Drive image returned HTTP 200, confirming production access uses federation.

## Checks Not Performed

- The Google Cloud configuration was user-entered and was not independently inspected through the user's browser.
- No automated cross-browser suite is configured. Relevant responsive, focus, modal, and browser behavior was verified during the preceding event-card phase rather than repeated after this server-only authentication change.

## Residual Risk and Follow-up

- Local development no longer has Google credentials and therefore uses the static fallback dataset. Development federation can be added later with a separately approved, exact development principal if live Google data is needed locally.
- Publicly displayed event images remain downloadable by visitors, as explicitly accepted for the public production site.
- Renaming the Vercel team or project changes OIDC claims and requires updating the Google provider or IAM principals.

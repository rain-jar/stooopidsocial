import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";
import {
  ExternalAccountClient,
  GoogleAuth,
  type AuthClient,
} from "google-auth-library";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server configuration: ${name}`);
  }
  return value;
}

const FEDERATION_ENVIRONMENT_VARIABLES = [
  "GCP_PROJECT_NUMBER",
  "GCP_WORKLOAD_IDENTITY_POOL_ID",
  "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
] as const;

let authClientPromise: Promise<AuthClient> | null = null;

function configuredEnvironmentValue(name: string) {
  return process.env[name]?.trim() || null;
}

async function createGoogleAuthClient() {
  const federationValues = FEDERATION_ENVIRONMENT_VARIABLES.map((name) =>
    configuredEnvironmentValue(name),
  );
  const hasAnyFederationConfiguration = federationValues.some(Boolean);
  const hasCompleteFederationConfiguration = federationValues.every(Boolean);

  if (process.env.VERCEL || hasAnyFederationConfiguration) {
    if (!hasCompleteFederationConfiguration) {
      throw new Error(
        "Incomplete Google Workload Identity Federation configuration",
      );
    }

    const [projectNumber, poolId, providerId] = federationValues as [
      string,
      string,
      string,
    ];
    const serviceAccountEmail = requiredEnvironmentValue(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    );
    const client = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:generateAccessToken`,
      scopes: GOOGLE_SCOPES,
      subject_token_supplier: {
        getSubjectToken: () => getVercelOidcToken(),
      },
    });

    if (!client) {
      throw new Error("Unable to initialize Google federated authentication");
    }

    return client;
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: requiredEnvironmentValue("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: requiredEnvironmentValue(
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
      ).replace(/\\n/g, "\n"),
    },
    scopes: GOOGLE_SCOPES,
  });

  return auth.getClient();
}

function getGoogleAuthClient() {
  authClientPromise ??= createGoogleAuthClient();
  return authClientPromise;
}

export function getGoogleConfiguration() {
  return {
    sheetId: requiredEnvironmentValue("GOOGLE_SHEET_ID"),
    sheetRange: requiredEnvironmentValue("GOOGLE_SHEET_RANGE"),
    driveFolderId: requiredEnvironmentValue("GOOGLE_DRIVE_FOLDER_ID"),
  };
}

export async function getGoogleAccessToken() {
  const client = await getGoogleAuthClient();
  const token = await client.getAccessToken();
  const accessToken = typeof token === "string" ? token : token?.token;

  if (!accessToken) {
    throw new Error("Google authentication did not return an access token");
  }

  return accessToken;
}

export async function googleFetch(url: string, init?: RequestInit) {
  const accessToken = await getGoogleAccessToken();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(url, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(10_000),
  });
}

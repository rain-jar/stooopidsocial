import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | undefined;
let adminClient: SupabaseClient | undefined;

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
} as const;

export function getPublicSupabaseClient() {
  publicClient ??= createClient(
    requiredEnvironmentValue("SUPABASE_URL"),
    requiredEnvironmentValue("SUPABASE_ANON_KEY"),
    { auth: authOptions },
  );
  return publicClient;
}

export function getAdminSupabaseClient() {
  adminClient ??= createClient(
    requiredEnvironmentValue("SUPABASE_URL"),
    requiredEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: authOptions },
  );
  return adminClient;
}

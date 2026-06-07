// Environment helpers. Reads NEXT_PUBLIC_APP_ENV so the value is available on
// both the server and the client.

export type AppEnv = 'development' | 'staging' | 'production';

export function appEnv(): AppEnv {
  return (process.env.NEXT_PUBLIC_APP_ENV as AppEnv) ?? 'development';
}

export function isEnvProduction() {
  return appEnv() === 'production';
}

export function isEnvStaging() {
  return appEnv() === 'staging';
}

export function isEnvDevelopment() {
  return appEnv() === 'development';
}

// Server-only env getters — throw at call-time if a required variable is missing.
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  // LiteLLM is an OpenAI-compatible gateway; the AI SDK's openai provider talks to it via baseURL.
  litellmBaseUrl: () => required('LITELLM_BASE_URL'),
  litellmApiKey: () => required('LITELLM_API_KEY'),
  litellmModel: () => required('LITELLM_MODEL'),
  authSecret: () => required('AUTH_SECRET'),
  // Vercel Blob auth resolves automatically from VERCEL_OIDC_TOKEN + BLOB_STORE_ID (no RW token needed).
};

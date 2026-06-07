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

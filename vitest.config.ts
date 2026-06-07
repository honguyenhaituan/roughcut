import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Unit tests sit next to source; integration tests in tests/integration.
    // E2E (tests/e2e/*.spec.ts) is run by Playwright, not Vitest.
    include: ['src/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    alias: {
      // server-only throws when imported outside a Server Component; stub it so
      // server-layer modules can be unit-tested.
      'server-only': fileURLToPath(
        new URL('./tests/stubs/server-only.ts', import.meta.url),
      ),
    },
  },
});

import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable ESLint rules that conflict with Prettier
  prettierConfig,
  // Run Prettier as an ESLint rule
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.agents/**',
    '.claude/**',
    'src/generated/**',
  ]),
]);

export default eslintConfig;

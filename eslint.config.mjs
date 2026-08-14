import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
    'coverage/**'
  ]),

  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      // Existing effects load data from external APIs. This rule cannot
      // distinguish those asynchronous updates from synchronous state changes.
      'react-hooks/set-state-in-effect': 'off'
    }
  }
]);

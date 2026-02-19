import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'


const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // eslint-plugin-react uses context.getFilename() which was removed in
    // ESLint 10. Setting an explicit version bypasses the auto-detect code
    // path that triggers the error.
    settings: {
      react: { version: '19' },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/workbox-*.js',
    'public/sw.js',
    'types/next.d.ts',
    'generated/nexus-typegen.ts'
  ]),
])

export default eslintConfig
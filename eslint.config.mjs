import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    ignorePatterns: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "utils/**",
      "public/workbox-*.js",
      "public/workbox-*.js.map",
      "types/next.d.ts",
      "public/sw.js",
      "next-env.d.ts",
      "generated/nexus-typegen.ts",
    ],
  }),
];

export default eslintConfig;

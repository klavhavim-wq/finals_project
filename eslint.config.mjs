import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone Node harnesses under tools/, not part of the site. They are
    // CommonJS and are kept exactly as they were written, so the app's rules
    // report sixteen findings against them — noise that reads like the site
    // regressing when nothing about the site has changed.
    "tools/**",
  ]),
]);

export default eslintConfig;

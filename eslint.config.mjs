import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // react-three-fiber's useFrame callback runs outside React's render pass and
    // is designed around per-frame mutation of the camera / object refs, which the
    // react-hooks/immutability lint (a React Compiler rule) cannot model.
    files: ["src/components/**/*.tsx"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          // Props deliberately pulled out of a `...rest` spread so they don't
          // leak downstream (common in the model wrapper components).
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dist/**",
  ]),
]);

export default eslintConfig;

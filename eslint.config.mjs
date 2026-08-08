import boundaries from "eslint-plugin-boundaries";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * ESLint config with boundary rules for the admin app.
 *
 * `eslint-config-next` (Next 16) ships NATIVE flat configs, so we spread them
 * directly. Do NOT route them through `@eslint/eslintrc`'s `FlatCompat` — under
 * ESLint 9 that throws `TypeError: Converting circular structure to JSON` while
 * validating the shareable config, which silently disables linting.
 *
 * Install required packages:
 *   npm install -D eslint-plugin-boundaries
 *
 * What this enforces (eslint-plugin-boundaries v6 `boundaries/dependencies`):
 *
 * 1. Cross-layer imports follow the layered architecture rules
 *    (see docs/ARCHITECTURE.md for the matrix).
 * 2. Features cannot import each other.
 * 3. Features can only be imported via their barrel (src/features/X/index.ts).
 *    Deep imports like @/features/orders/components/foo are blocked.
 *
 * If a violation fires, the right response is usually:
 *  - Move the shared thing to lib/, types/, or components/shared/
 *  - Re-export through the feature barrel
 *  - Refactor the feature boundary itself
 * Do NOT add eslint-disable comments — exceptions compound.
 */

const eslintConfig = [
  // Next.js + TypeScript defaults (native flat configs)
  ...nextCoreWebVitals,
  ...nextTypescript,

  // Boundary plugin: defines layers and what they may import
  {
    plugins: { boundaries },

    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "features", pattern: "src/features/*", mode: "folder" },
        { type: "components", pattern: "src/components/**" },
        { type: "lib", pattern: "src/lib/**" },
        { type: "types", pattern: "src/types/**" },
        { type: "providers", pattern: "src/providers/**" },
        { type: "config", pattern: "src/config/**" },
      ],
      "boundaries/include": ["src/**/*.ts", "src/**/*.tsx"],
    },

    rules: {
      // One `dependencies` rule covers both concerns the deprecated
      // `element-types` + `entry-point` pair used to: cross-layer legality AND
      // the feature barrel. Rules are evaluated in order and the LAST matching
      // rule wins — so the barrel disallow comes last to override the per-layer
      // allowances for deep feature imports (allowed to the feature *type*, but
      // not to its non-index files).
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            // app/ orchestrates — may import any layer except itself
            {
              from: { type: "app" },
              allow: {
                to: {
                  type: [
                    "features",
                    "components",
                    "lib",
                    "types",
                    "providers",
                    "config",
                  ],
                },
              },
            },

            // features are siblings — never each other; shared layers + config only
            {
              from: { type: "features" },
              allow: { to: { type: ["components", "lib", "types", "config"] } },
            },

            // shared components are foundational UI — depend on lib + types
            {
              from: { type: "components" },
              allow: { to: { type: ["lib", "types"] } },
            },

            // lib is framework- and feature-agnostic — types + the validated
            // env/config leaf (config imports only types, so no cycle).
            {
              from: { type: "lib" },
              allow: { to: { type: ["types", "config"] } },
            },

            // providers wrap the app — same allowances as components
            {
              from: { type: "providers" },
              allow: { to: { type: ["lib", "types"] } },
            },

            // config is static — types only
            {
              from: { type: "config" },
              allow: { to: { type: ["types"] } },
            },

            // types must be pure — no runtime imports
            {
              from: { type: "types" },
              disallow: { to: { type: "*" } },
            },

            // Barrel: a feature may only be entered via its root index.ts, from
            // anywhere (overrides the type allowances above for deep imports).
            {
              to: { type: "features", internalPath: "!index.ts" },
              disallow: { from: { type: "*" } },
            },
          ],
        },
      ],
    },
  },

  // Ignore generated files, build output, and tooling
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/types/api.d.ts", // future codegen output
      "public/**",
    ],
  },
];

export default eslintConfig;

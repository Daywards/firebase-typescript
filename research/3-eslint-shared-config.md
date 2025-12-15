# Shared ESLint Config in Pnpm Monorepo

## Objective

Establish best practices for sharing a single, maintainable ESLint configuration across a pnpm monorepo using ESLint 9's Flat Config.

## Findings

### 1. Centralized Configuration Package

The industry standard pattern is to create a dedicated internal package (e.g., `@packages/eslint-config`) that houses all ESLint-related dependencies and configuration logic.

- **Structure:**
    ```text
    packages/
    └── eslint-config/
        ├── package.json
        ├── index.js      # Base config
        ├── react.js      # React-specific rules
        ├── next.js       # Next.js-specific rules
        └── library.js    # Logic for generic libraries
    ```
- **Dependencies:** All plugins (`@stylistic/eslint-plugin`, `typescript-eslint`, etc.) are dependencies of _this_ package, not the individual apps.

### 2. Flat Config Usage

Each application or package in the monorepo should have its own minimal `eslint.config.mjs` that imports and extends the shared config.

**Example App Config:**

```javascript
import sharedConfig from '@packages/eslint-config/next';

export default [
    ...sharedConfig,
    {
        // App-specific overrides
        ignores: ['build/'],
    },
];
```

### 3. TypeScript Handling

One common pitfall is `parserOptions.project`. In a monorepo, the relative paths to `tsconfig.json` can break when extending configs.

- **Best Practice:** The shared config should allow passing the `tsconfigRootDir` or the consuming config should set it.
- **Alternative:** Use `typescript-eslint`'s specialized monorepo helpers if available, or simply ensure the shared config provides a factory function that accepts the project path.

### 4. Recommendation for This Repo

1.  Create `packages/eslint-config`.
2.  Move `eslint.config.mjs` logic (stroustrup rules, TS setup) there.
3.  Install all ESLint plugins in `packages/eslint-config`.
4.  Update `apps/*` and `scripts/` to depend on `@packages/eslint-config` and import the config.

## Next Steps

- Scaffold `packages/eslint-config`.
- Migrate rules from root `eslint.config.mjs`.
- Refactor `scripts/` and apps to use the shared config.

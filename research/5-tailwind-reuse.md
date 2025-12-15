# Storybook & Tailwind CSS v4 in Monorepos

## Introduction

Tailwind CSS v4 introduces a "CSS-first" configuration approach, replacing the traditional `tailwind.config.js` with direct CSS directives. This significantly simplifies shared configuration in a monorepo setup but requires specific patterns for content scanning (`@source`) and theme sharing (`@theme`).

## Strategies for Shared Configuration

To ensure consistent design tokens (colors, fonts, etc.) across apps and Storybook, we should define the theme in a shared CSS file within `packages/ui`.

### 1. Shared Theme Definition

Create a central CSS file, e.g., `packages/ui/src/theme.css`:

```css
@theme {
    --color-brand-primary: #3b82f6;
    --font-family-sans: 'Inter', sans-serif;
    /* Add other shared tokens here */
}
```

### 2. Consuming the Theme

**In Apps (e.g., `apps/fb-hosting/src/index.css`):**
Import the shared theme and `@import "tailwindcss"`.

```css
@import 'tailwindcss';
@import '@packages/ui/src/theme.css'; /* Package resolution supported by Tailwind v4 */
```

**In Storybook (`packages/ui/.storybook/preview.css`):**
Storybook needs the same setup to render components correctly.

```css
@import 'tailwindcss';
@import '../src/theme.css';
```

## Content Scanning with `@source`

Tailwind v4 automatically scans files in the current directory, but for workspace packages or monorepos, you must explicitly tell it where to look for class usage using the `@source` directive.

### For Apps

To ensure the app's Tailwind build includes styles used in `packages/ui`, add:

```css
/* apps/fb-hosting/src/index.css */
@import 'tailwindcss';
@source "../../../packages/ui"; /* Scan the UI package */
```

### For Storybook (in `packages/ui`)

Storybook running in `packages/ui` needs to scan the component files.

```css
/* packages/ui/.storybook/preview.css */
@import 'tailwindcss';
@source "../src";
```

## Storybook Implementation Plan

1.  **Dependencies**: Install necessary packages in `packages/ui`:

    ```bash
    pnpm add -D -w @storybook/react @storybook/addon-essentials @storybook/builder-vite @tailwindcss/vite tailwindcss
    ```

2.  **Configuration**:
    - Create `.storybook/main.ts`: Configure frameworks and addons.
    - Create `.storybook/preview.ts`: Import the CSS file.
    - Create `.storybook/preview.css`: Setup Tailwind imports and `@source`.

3.  **Vite Integration**:
    - Storybook 8+ with Vite builder works seamlessly.
    - Ensure `@tailwindcss/vite` is added to the Vite config used by Storybook. You might need a `vite.config.ts` in `.storybook` or `packages/ui` that includes the plugin.

## Best Practices Checklist

- [ ] **Single Source of Truth**: Define all custom tokens in `theme.css` in the UI package.
- [ ] **Explicit Scanning**: Always use `@source` to avoid missing styles from external packages.
- [ ] **Component Isolation**: Storybook is the source of truth for UI components; ensure it renders exactly like the app by using the exact same CSS setup.

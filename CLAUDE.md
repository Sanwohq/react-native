# Sanwo React Native SDK

## Project Overview

React Native SDK for Sanwo. Wraps provider HTML templates in a React Native WebView modal. Uses `@sanwohq/core` for template rendering and the event system.

## Setup

```bash
npm install
npm run build
```

## Architecture

- `src/context.tsx` — `SanwoProvider` context + modal orchestration
- `src/use-sanwo-checkout.tsx` — Consumer hook (`checkout`, `isLoading`, `error`, `result`, `reset`)
- `src/checkout-modal.tsx` — Internal Modal + WebView component
- `src/types.ts` — Internal type definitions

### How it works

1. `SanwoProvider` holds the provider config and renders a hidden `SanwoCheckoutModal`
2. `useSanwoCheckout().checkout(options)` builds HTML from the provider template and shows the modal
3. The WebView loads the HTML and the provider JS calls `sanwoCallback(event, data)`
4. The bridge sends `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'sanwo', event, data }))`
5. `onMessage` handler parses the message, settles the promise, and closes the modal

## CI/CD

### Release (`release.yml`)
- **Triggers**: push to main, PRs to main
- **Jobs**:
  - `build` — `npm install` + `npm run build` (TypeScript compilation)
  - `publish` — Runs on main push only. Uses **Changesets** (`npx changeset version` + `npx changeset publish`) to publish to npm
- **Requires**: `NPM_TOKEN` secret for npm registry auth
- **Version bumps**: Changesets auto-commits version bumps and pushes to main

### How to publish a new version
1. Run `npx changeset` to create a changeset
2. Push to main — CI runs `changeset version` + `changeset publish`
3. The `.changeset/config.json` controls changeset behavior

## Key Conventions

- Peer dependencies: `react >= 18`, `react-native >= 0.70`, `react-native-webview >= 11`
- Uses `jsx: "react-jsx"` (no explicit React import needed for JSX)
- `skipLibCheck: true` in tsconfig due to react-native-webview type incompatibilities with React 19
- Provider templates are sourced from `@sanwohq/core` — changes to templates must be made in the core repo

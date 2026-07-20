# Sanwo React Native SDK

## Setup
```bash
npm install
npm run build
```

## Architecture
- Uses `@sanwohq/core` for template rendering and event system
- Wraps provider HTML in a React Native WebView (Modal)
- Messages bridge via `window.ReactNativeWebView.postMessage`

## Key files
- `src/context.tsx` — SanwoProvider context + modal orchestration
- `src/use-sanwo-checkout.tsx` — Consumer hook (checkout, isLoading, error, result, reset)
- `src/checkout-modal.tsx` — Internal Modal + WebView component
- `src/types.ts` — Internal type definitions

## How it works
1. `SanwoProvider` holds the provider config and renders a hidden `SanwoCheckoutModal`
2. `useSanwoCheckout().checkout(options)` builds HTML from the provider template and shows the modal
3. The WebView loads the HTML and the provider JS calls `sanwoCallback(event, data)`
4. The bridge sends `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'sanwo', event, data }))`
5. `onMessage` handler parses the message, settles the promise, and closes the modal

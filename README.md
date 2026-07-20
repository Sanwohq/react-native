# @sanwohq/react-native

React Native SDK for [Sanwo](https://sanwohq.com) — one interface for every payment provider.

## Installation

```bash
npm install @sanwohq/react-native react-native-webview
```

You also need a provider package:

```bash
npm install @sanwohq/paystack
# or @sanwohq/flutterwave, @sanwohq/stripe, @sanwohq/paypal, etc.
```

### iOS

```bash
cd ios && pod install
```

## Quick Start

```tsx
import { SanwoProvider, useSanwoCheckout } from '@sanwohq/react-native';
import { paystackProvider } from '@sanwohq/paystack';

function App() {
  return (
    <SanwoProvider provider={paystackProvider} publicKey="pk_test_...">
      <CheckoutScreen />
    </SanwoProvider>
  );
}

function CheckoutScreen() {
  const { checkout, isLoading } = useSanwoCheckout();

  const handlePay = async () => {
    const result = await checkout({
      amount: 500000, // amount in minor units (e.g. kobo)
      currency: 'NGN',
      customer: { email: 'user@example.com' },
      onLoad: () => console.log('Checkout loaded'),
      onError: (err) => console.error(err),
    });

    switch (result.status) {
      case 'successful':
        console.log('Payment successful!', result.reference);
        break;
      case 'cancelled':
        console.log('User cancelled');
        break;
      case 'failed':
        console.log('Payment failed', result.error);
        break;
    }
  };

  return <Button title="Pay" onPress={handlePay} disabled={isLoading} />;
}
```

## API

### `<SanwoProvider>`

Wrap your app or screen with `SanwoProvider` to provide payment configuration.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `provider` | `SanwoProviderDefinition` | Yes | Provider from a Sanwo provider package |
| `publicKey` | `string` | Yes | Your public/publishable API key |
| `debug` | `boolean` | No | Enable debug logging (default: `false`) |
| `timeout` | `number` | No | Checkout timeout in ms (default: `120000`) |

### `useSanwoCheckout()`

Hook that returns:

| Property | Type | Description |
|----------|------|-------------|
| `checkout` | `(options: CheckoutOptions) => Promise<CheckoutResult>` | Start a checkout |
| `isLoading` | `boolean` | Whether a checkout is in progress |
| `error` | `SanwoError \| null` | Last error |
| `result` | `CheckoutResult \| null` | Last result |
| `reset` | `() => void` | Reset state |

### `CheckoutOptions`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `amount` | `number` | Yes | Amount in minor units (e.g. kobo, cents) |
| `currency` | `string` | Yes | ISO 4217 currency code |
| `reference` | `string` | No | Custom payment reference |
| `customer` | `CheckoutCustomer` | Yes | Customer details (email required) |
| `metadata` | `Record<string, unknown>` | No | Extra metadata |
| `description` | `string` | No | Payment description |
| `onLoad` | `() => void` | No | Called when checkout UI loads |
| `onError` | `(error) => void` | No | Called on error |
| `sanwoProviderOptions` | `Record<string, unknown>` | No | Provider-specific options |

### Events

Listen to checkout lifecycle events:

```tsx
function App() {
  return (
    <SanwoProvider provider={paystackProvider} publicKey="pk_test_...">
      <EventListener />
    </SanwoProvider>
  );
}

function EventListener() {
  const { on } = useSanwoContext();

  useEffect(() => {
    const unsubscribe = on('success', (event) => {
      console.log('Payment succeeded:', event.data);
    });
    return unsubscribe;
  }, [on]);

  return <CheckoutScreen />;
}
```

## Supported Providers

Any provider package built for Sanwo works out of the box:

- `@sanwohq/paystack` — Paystack
- `@sanwohq/flutterwave` — Flutterwave
- `@sanwohq/stripe` — Stripe
- `@sanwohq/paypal` — PayPal
- `@sanwohq/razorpay` — Razorpay
- `@sanwohq/monnify` — Monnify
- `@sanwohq/interswitch` — Interswitch

## How It Works

1. Provider packages export a `SanwoProviderDefinition` with an HTML `template`
2. The SDK renders the template with your params and a React Native bridge function
3. The HTML is loaded in a WebView inside a Modal
4. The provider JS calls `sanwoCallback(event, data)` which posts a message to the native layer
5. The SDK parses the message, resolves the checkout promise, and closes the modal

## Requirements

- React Native >= 0.70
- react-native-webview >= 11.0
- React >= 18

## License

Apache-2.0

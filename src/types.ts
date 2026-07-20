import type { ReactNode } from "react";
import type {
  SanwoProviderDefinition,
  CheckoutOptions,
  CheckoutResult,
  CheckoutEventType,
  CheckoutEventHandler,
} from "@sanwohq/core";
import type { SanwoError } from "@sanwohq/core";

/**
 * Props for the SanwoProvider component.
 */
export interface SanwoProviderProps {
  /** The payment provider definition (e.g. from @sanwohq/paystack). */
  provider: SanwoProviderDefinition;
  /** Your public/publishable key for the payment provider. */
  publicKey: string;
  /** Enable debug logging. */
  debug?: boolean;
  /** Checkout timeout in milliseconds. Defaults to 120000 (2 minutes). */
  timeout?: number;
  children: ReactNode;
}

/**
 * Internal context value shared between SanwoProvider and hooks.
 */
export interface SanwoContextValue {
  provider: SanwoProviderDefinition;
  publicKey: string;
  debug: boolean;
  timeout: number;
  on: <T = unknown>(
    event: CheckoutEventType,
    handler: CheckoutEventHandler<T>,
  ) => () => void;
  off: <T = unknown>(
    event: CheckoutEventType,
    handler: CheckoutEventHandler<T>,
  ) => void;
  /** Show the checkout modal. Called internally by useSanwoCheckout. */
  requestCheckout: (options: CheckoutOptions) => Promise<CheckoutResult>;
}

/**
 * Return type for the useSanwoCheckout hook.
 */
export interface UseSanwoCheckoutReturn {
  /** Initiate a checkout. Resolves when the payment completes or is cancelled. */
  checkout: (options: CheckoutOptions) => Promise<CheckoutResult>;
  /** Whether a checkout is currently in progress. */
  isLoading: boolean;
  /** The last error that occurred, if any. */
  error: SanwoError | null;
  /** The last checkout result, if any. */
  result: CheckoutResult | null;
  /** Reset the hook state (error, result, isLoading). */
  reset: () => void;
}

/**
 * Internal props for the checkout modal component.
 */
export interface CheckoutModalProps {
  visible: boolean;
  html: string;
  timeout: number;
  debug: boolean;
  providerId: string;
  onMessage: (message: SanwoWebViewMessage) => void;
  onClose: () => void;
  onError: (error: Error) => void;
}

/**
 * The shape of messages sent from the WebView via ReactNativeWebView.postMessage.
 */
export interface SanwoWebViewMessage {
  type: "sanwo";
  event: "success" | "cancelled" | "closed" | "error" | "loaded";
  data: Record<string, unknown>;
}

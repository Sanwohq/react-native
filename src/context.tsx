import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  EventEmitter,
  SanwoError,
  buildTemplateParams,
  renderTemplate,
  getBridge,
  validateCheckoutOptions,
  generateReference,
} from "@sanwohq/core";
import type {
  CheckoutOptions,
  CheckoutResult,
  CheckoutEvent,
  CheckoutEventType,
  CheckoutEventHandler,
} from "@sanwohq/core";
import { SanwoCheckoutModal } from "./checkout-modal";
import type {
  SanwoProviderProps,
  SanwoContextValue,
  SanwoWebViewMessage,
} from "./types";

const SanwoContext = createContext<SanwoContextValue | null>(null);

/**
 * Provides Sanwo payment configuration to child components.
 * Wrap your app (or a subtree) with this provider, then use
 * `useSanwoCheckout()` in any descendant to trigger a payment.
 *
 * @example
 * ```tsx
 * import { SanwoProvider } from '@sanwohq/react-native';
 * import { paystackProvider } from '@sanwohq/paystack';
 *
 * function App() {
 *   return (
 *     <SanwoProvider provider={paystackProvider} publicKey="pk_test_...">
 *       <CheckoutScreen />
 *     </SanwoProvider>
 *   );
 * }
 * ```
 */
export function SanwoProvider({
  provider,
  publicKey,
  debug = false,
  timeout = 120_000,
  children,
}: SanwoProviderProps) {
  const emitterRef = useRef(new EventEmitter());

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState("");

  // Refs for the pending checkout promise
  const resolveRef = useRef<((result: CheckoutResult) => void) | null>(null);
  const optionsRef = useRef<CheckoutOptions | null>(null);
  const referenceRef = useRef<string>("");
  const settledRef = useRef(false);

  const log = useCallback(
    (message: string) => {
      if (debug) {
        console.log(`[Sanwo:RN:${provider.id}] ${message}`);
      }
    },
    [debug, provider.id],
  );

  const emitEvent = useCallback(
    (type: CheckoutEventType, data?: unknown) => {
      const event: CheckoutEvent = {
        type,
        provider: provider.id,
        timestamp: Date.now(),
        data,
      };
      emitterRef.current.emit(type, event);
    },
    [provider.id],
  );

  const settle = useCallback(
    (result: CheckoutResult) => {
      if (settledRef.current) return;
      settledRef.current = true;

      setModalVisible(false);
      setCheckoutHtml("");

      if (result.status === "successful") {
        emitEvent("success", result);
      } else if (result.status === "cancelled") {
        emitEvent("cancelled", result);
      } else if (result.status === "failed") {
        emitEvent("failed", result);
      }

      emitEvent("closed", result);

      resolveRef.current?.(result);
      resolveRef.current = null;
      optionsRef.current = null;
    },
    [emitEvent],
  );

  const handleMessage = useCallback(
    (message: SanwoWebViewMessage) => {
      const options = optionsRef.current;
      const reference = referenceRef.current;

      switch (message.event) {
        case "loaded":
          log("Checkout loaded");
          emitEvent("loaded", { reference });
          options?.onLoad?.();
          break;

        case "success":
          settle({
            status: "successful",
            provider: provider.id,
            reference:
              (message.data.reference as string | undefined) || reference,
            transactionId: message.data.transaction_id
              ? String(message.data.transaction_id)
              : undefined,
            raw: message.data,
          });
          break;

        case "cancelled":
        case "closed":
          settle({
            status: "cancelled",
            provider: provider.id,
            reference,
          });
          break;

        case "error":
          options?.onError?.({
            message:
              (message.data.message as string | undefined) || "Checkout failed",
            raw: message.data,
          });
          settle({
            status: "failed",
            provider: provider.id,
            reference,
            error: {
              code: "CHECKOUT_FAILED",
              message:
                (message.data.message as string | undefined) ||
                "Checkout failed",
              provider: provider.id,
              recoverable: false,
            },
            raw: message.data,
          });
          break;
      }
    },
    [log, emitEvent, settle, provider.id],
  );

  const handleClose = useCallback(() => {
    log("Modal closed by user");
    settle({
      status: "cancelled",
      provider: provider.id,
      reference: referenceRef.current,
    });
  }, [log, settle, provider.id]);

  const handleError = useCallback(
    (error: Error) => {
      log(`Checkout error: ${error.message}`);
      const options = optionsRef.current;
      options?.onError?.({
        message: error.message,
      });
      settle({
        status: "failed",
        provider: provider.id,
        reference: referenceRef.current,
        error: {
          code: error.message.includes("timed out") ? "TIMEOUT" : "CHECKOUT_FAILED",
          message: error.message,
          provider: provider.id,
          recoverable: error.message.includes("timed out"),
        },
      });
    },
    [log, settle, provider.id],
  );

  const requestCheckout = useCallback(
    (options: CheckoutOptions): Promise<CheckoutResult> => {
      if (modalVisible) {
        return Promise.reject(
          new SanwoError({
            code: "CHECKOUT_ALREADY_ACTIVE",
            message: "A checkout is already in progress",
          }),
        );
      }

      validateCheckoutOptions(options);

      const resolvedOptions = options.reference
        ? options
        : { ...options, reference: generateReference() };

      const reference = resolvedOptions.reference!;
      referenceRef.current = reference;

      const params = buildTemplateParams(resolvedOptions, publicKey, provider);
      const bridge = getBridge("react-native");
      const html = renderTemplate(provider.template, params, bridge);

      optionsRef.current = resolvedOptions;
      settledRef.current = false;

      emitEvent("started", { reference });

      return new Promise<CheckoutResult>((resolve) => {
        resolveRef.current = resolve;
        setCheckoutHtml(html);
        setModalVisible(true);

        emitEvent("opened", { reference });
      });
    },
    [modalVisible, publicKey, provider, emitEvent],
  );

  const on = useCallback(
    <T = unknown>(
      event: CheckoutEventType,
      handler: CheckoutEventHandler<T>,
    ): (() => void) => {
      return emitterRef.current.on(event, handler);
    },
    [],
  );

  const off = useCallback(
    <T = unknown>(
      event: CheckoutEventType,
      handler: CheckoutEventHandler<T>,
    ): void => {
      emitterRef.current.off(event, handler);
    },
    [],
  );

  const contextValue: SanwoContextValue = {
    provider,
    publicKey,
    debug,
    timeout,
    on,
    off,
    requestCheckout,
  };

  return (
    <SanwoContext.Provider value={contextValue}>
      {children}
      <SanwoCheckoutModal
        visible={modalVisible}
        html={checkoutHtml}
        timeout={timeout}
        debug={debug}
        providerId={provider.id}
        onMessage={handleMessage}
        onClose={handleClose}
        onError={handleError}
      />
    </SanwoContext.Provider>
  );
}

/**
 * Access the raw Sanwo context. Prefer `useSanwoCheckout()` for most use cases.
 * Throws if called outside a `SanwoProvider`.
 */
export function useSanwoContext(): SanwoContextValue {
  const context = useContext(SanwoContext);
  if (!context) {
    throw new Error(
      "useSanwoContext must be used within a <SanwoProvider>. " +
        "Wrap your component tree with <SanwoProvider provider={...} publicKey={...}>.",
    );
  }
  return context;
}

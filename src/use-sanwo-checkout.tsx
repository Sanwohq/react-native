import { useState, useCallback } from "react";
import type { CheckoutOptions, CheckoutResult } from "@sanwohq/core";
import { SanwoError } from "@sanwohq/core";
import { useSanwoContext } from "./context";
import type { UseSanwoCheckoutReturn } from "./types";

/**
 * Hook to trigger a Sanwo payment checkout.
 *
 * Must be used inside a `<SanwoProvider>`.
 *
 * @example
 * ```tsx
 * function CheckoutScreen() {
 *   const { checkout, isLoading } = useSanwoCheckout();
 *
 *   const handlePay = async () => {
 *     const result = await checkout({
 *       amount: 500000,
 *       currency: 'NGN',
 *       customer: { email: 'user@example.com' },
 *       onLoad: () => console.log('Checkout loaded'),
 *       onError: (err) => console.error(err),
 *     });
 *     console.log(result.status); // 'successful' | 'cancelled' | 'failed'
 *   };
 *
 *   return <Button title="Pay" onPress={handlePay} disabled={isLoading} />;
 * }
 * ```
 */
export function useSanwoCheckout(): UseSanwoCheckoutReturn {
  const { requestCheckout } = useSanwoContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SanwoError | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const checkout = useCallback(
    async (options: CheckoutOptions): Promise<CheckoutResult> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const checkoutResult = await requestCheckout(options);
        setResult(checkoutResult);
        return checkoutResult;
      } catch (err) {
        const sanwoError =
          err instanceof SanwoError
            ? err
            : new SanwoError({
                code: "UNKNOWN_ERROR",
                message:
                  err instanceof Error ? err.message : "Unknown error",
                cause: err,
              });
        setError(sanwoError);
        throw sanwoError;
      } finally {
        setIsLoading(false);
      }
    },
    [requestCheckout],
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { checkout, isLoading, error, result, reset };
}

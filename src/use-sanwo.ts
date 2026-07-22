import { useSanwoContext } from "./context";

export function useSanwo() {
  const { provider, publicKey, debug, timeout, on, off } = useSanwoContext();
  return {
    provider,
    providerId: provider.id,
    publicKey,
    debug,
    timeout,
    on,
    off,
  };
}

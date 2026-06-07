'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns true once running on the client (false during SSR and the first
 * hydration render). Useful to guard client-only content against hydration
 * mismatches. Uses `useSyncExternalStore` so there's no effect/setState churn.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default useIsMounted;

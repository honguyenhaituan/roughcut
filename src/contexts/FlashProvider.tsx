'use client';

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type FlashKind = 'info' | 'success' | 'error';

export interface FlashMessage {
  id: string;
  kind: FlashKind;
  message: string;
}

interface FlashContextValue {
  flashes: FlashMessage[];
  addFlash: (kind: FlashKind, message: string) => void;
  removeFlash: (id: string) => void;
}

export const FlashContext = createContext<FlashContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export default function FlashProvider({ children }: { children: ReactNode }) {
  const [flashes, setFlashes] = useState<FlashMessage[]>([]);

  const removeFlash = useCallback((id: string) => {
    setFlashes((current) => current.filter((flash) => flash.id !== id));
  }, []);

  const addFlash = useCallback(
    (kind: FlashKind, message: string) => {
      const id = crypto.randomUUID();
      setFlashes((current) => [...current, { id, kind, message }]);
      setTimeout(() => removeFlash(id), AUTO_DISMISS_MS);
    },
    [removeFlash],
  );

  const value = useMemo(
    () => ({ flashes, addFlash, removeFlash }),
    [flashes, addFlash, removeFlash],
  );

  return (
    <FlashContext.Provider value={value}>{children}</FlashContext.Provider>
  );
}

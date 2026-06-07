'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import FlashProvider from '@/contexts/FlashProvider';
import Flash from '@/components/Flash';

/**
 * Client-side providers mounted once in the root layout. Add global context
 * providers here (SWR cache, flash messages, theme, auth, ...).
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <FlashProvider>
        {children}
        <Flash />
      </FlashProvider>
    </SWRConfig>
  );
}

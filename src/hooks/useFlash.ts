'use client';

import { useContext } from 'react';
import { FlashContext } from '@/contexts/FlashProvider';

/** Access the flash/toast API. Must be used inside <FlashProvider>. */
export function useFlash() {
  const context = useContext(FlashContext);
  if (!context) {
    throw new Error('useFlash must be used within a FlashProvider');
  }
  return context;
}

export default useFlash;

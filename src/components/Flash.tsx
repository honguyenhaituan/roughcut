'use client';

import { useFlash } from '@/hooks/useFlash';
import type { FlashKind } from '@/contexts/FlashProvider';

const kindStyles: Record<FlashKind, string> = {
  info: 'bg-zinc-900 text-white',
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
};

export default function Flash() {
  const { flashes, removeFlash } = useFlash();

  if (flashes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {flashes.map((flash) => (
        <button
          key={flash.id}
          type="button"
          onClick={() => removeFlash(flash.id)}
          className={`pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 text-left text-sm shadow-lg transition hover:opacity-90 ${kindStyles[flash.kind]}`}
        >
          {flash.message}
        </button>
      ))}
    </div>
  );
}

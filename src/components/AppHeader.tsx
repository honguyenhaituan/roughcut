import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  /** Content rendered on the right (user menu, save state, actions). */
  right?: ReactNode;
  /** Show a "Back to library" link before the wordmark. */
  back?: boolean;
  /** Widen the inner container to match the article workspace. */
  wide?: boolean;
}

export function AppHeader({ right, back, wide }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-6 py-3 ${
          wide ? 'max-w-6xl' : 'max-w-5xl'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {back && (
            <Link
              href="/"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <span aria-hidden>←</span>
              <span className="hidden sm:inline">Library</span>
            </Link>
          )}
          <Link
            href="/"
            className="truncate text-sm font-semibold tracking-tight text-zinc-900"
          >
            Article Studio
          </Link>
        </div>
        {right && <div className="flex items-center gap-3">{right}</div>}
      </div>
    </header>
  );
}

'use client';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ArticleError({ reset }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <p className="mb-2 text-lg font-semibold text-zinc-800">
          Something went wrong
        </p>
        <p className="mb-6 text-sm text-zinc-500">
          An unexpected error occurred loading this article. You can try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold text-zinc-800">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          An unexpected error occurred. You can try again.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

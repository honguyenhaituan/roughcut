'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-600">
        An unexpected error occurred. You can try again.
      </p>
      <button
        onClick={reset}
        className="rounded bg-black px-4 py-2 text-sm text-white"
      >
        Try again
      </button>
    </main>
  );
}

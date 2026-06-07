import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold text-zinc-800">Not found</h1>
        <p className="mb-6 text-sm text-zinc-500">
          This page or article doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Back to library
        </Link>
      </div>
    </main>
  );
}

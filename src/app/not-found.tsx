import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="text-sm text-gray-600">
        This page or article doesn&apos;t exist.
      </p>
      <Link href="/" className="rounded bg-black px-4 py-2 text-sm text-white">
        Back to library
      </Link>
    </main>
  );
}

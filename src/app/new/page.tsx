import UploadDropzone from '@/components/UploadDropzone';
import { AppHeader } from '@/components/AppHeader';

export default function NewArticlePage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader back />
      <main className="mx-auto w-full max-w-xl px-4 pt-16 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Draft a new article
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
            Upload your rough travel notes — we&apos;ll plan an outline you can
            review before drafting. Nothing is invented; facts stay grounded to
            your notes.
          </p>
        </div>
        <UploadDropzone />
      </main>
    </div>
  );
}

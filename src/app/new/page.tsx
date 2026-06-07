import UploadDropzone from '@/components/UploadDropzone';

export default function NewArticlePage() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 pt-24 dark:bg-zinc-950">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Draft a new article
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Upload your rough notes — .docx, .txt, or .md
          </p>
        </div>
        <UploadDropzone />
      </div>
    </div>
  );
}

'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

const ACCEPTED_EXTS = ['.docx', '.txt', '.md'];
const ACCEPT_ATTR = ACCEPTED_EXTS.join(',');

interface SkippedFile {
  name: string;
  reason: string;
}

export default function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...list.filter((f) => !names.has(f.name))];
    });
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    // Reset so re-selecting the same file triggers onChange again
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!files.length || loading) return;

    setLoading(true);
    setError(null);

    const form = new FormData();
    for (const f of files) form.append('files', f);

    try {
      const res = await fetch('/api/articles', { method: 'POST', body: form });
      const json = (await res.json()) as
        | { id: string; truncated: boolean; skipped: SkippedFile[] }
        | { error: string };

      if (!res.ok || 'error' in json) {
        setError(
          'error' in json
            ? json.error
            : 'Something went wrong. Please try again.',
        );
        return;
      }

      router.push(`/articles/${json.id}`);
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="File upload area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-white p-8 text-center transition-colors ${
          dragging
            ? 'border-zinc-500 bg-zinc-100'
            : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'
        }`}
      >
        <span className="text-3xl">📄</span>
        <p className="text-sm font-medium text-zinc-700">
          Drag files here, or click to browse
        </p>
        <p className="text-xs text-zinc-500">
          {ACCEPTED_EXTS.join(', ')} supported
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* File chips */}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700"
            >
              <span className="max-w-48 truncate">{f.name}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(f.name);
                }}
                className="ml-0.5 flex size-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={files.length === 0 || loading}
        onClick={handleSubmit}
        className="mt-1 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? 'Reading your notes…' : 'Plan my article'}
      </button>
    </div>
  );
}

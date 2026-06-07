'use client';

import { useRef, useState } from 'react';
import type { Media } from '@/types';

interface Props {
  articleId: string;
  media: Media[];
  onUploaded: (m: Media) => void;
  onPick?: (mediaId: string) => void;
}

export function MediaTray({ articleId, media, onUploaded, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const extracted = media.filter((m) => m.origin === 'extracted');
  const uploaded = media.filter((m) => m.origin === 'uploaded');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/articles/${articleId}/media`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'Upload failed');
      }
      const item = (await res.json()) as Media;
      onUploaded(item);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
      // Reset so the same file can be picked again
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const renderGroup = (items: Media[], label: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          {label}
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.sourceFileName}
              onClick={() => onPick?.(m.id)}
              className={[
                'h-16 w-16 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 object-cover',
                onPick
                  ? 'cursor-pointer transition hover:ring-2 hover:ring-zinc-400'
                  : 'cursor-default',
              ].join(' ')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.src}
                alt={m.sourceFileName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      {media.length === 0 && (
        <p className="mb-3 text-center text-xs text-zinc-400">
          No images yet — upload one below.
        </p>
      )}
      {renderGroup(extracted, 'From your notes')}
      {renderGroup(uploaded, 'Uploaded')}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploadError && (
        <p className="mb-2 text-xs text-red-600">{uploadError}</p>
      )}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-md border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : '+ Upload image'}
      </button>
    </div>
  );
}

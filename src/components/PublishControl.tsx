'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  articleId: string;
  published: boolean;
  publicId: string | null;
}

export function PublishControl({
  articleId,
  published: initialPublished,
  publicId: initialPublicId,
}: Props) {
  const [published, setPublished] = useState(initialPublished);
  const [publicId, setPublicId] = useState(initialPublicId);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const url =
    publicId && typeof window !== 'undefined'
      ? `${window.location.origin}/p/${publicId}`
      : '';

  const publish = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/publish`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('publish failed');
      const { publicId: pid } = (await res.json()) as { publicId: string };
      setPublicId(pid);
      setPublished(true);
      setOpen(true);
    } catch {
      // leave UI in its prior state; user can retry
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/publish`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('unpublish failed');
      setPublished(false);
      setOpen(false);
    } catch {
      // no-op
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!published) {
    return (
      <button
        type="button"
        onClick={publish}
        disabled={busy}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {busy ? 'Publishing…' : 'Publish'}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700"
      >
        <span className="size-1.5 rounded-full bg-green-500" />
        Published
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
          <p className="mb-2 text-xs font-medium text-zinc-500">
            Public link — anyone with it can read.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
            />
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
            >
              Open public page ↗
            </a>
            <button
              type="button"
              onClick={unpublish}
              disabled={busy}
              className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {busy ? '…' : 'Unpublish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

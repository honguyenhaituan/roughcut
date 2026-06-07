'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Media } from '@/types';
import { MediaTray } from './MediaTray';

interface Props {
  imageId: string | null;
  media: Media[];
  articleId: string;
  onChange: (mediaId: string | null) => void;
  onUploaded: (m: Media) => void;
  label?: string;
}

export function ImageSlot({
  imageId,
  media,
  articleId,
  onChange,
  onUploaded,
  label,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const current = imageId ? media.find((m) => m.id === imageId) : null;

  if (current) {
    return (
      <div className="group relative mb-4 overflow-hidden rounded-lg border border-zinc-200">
        {label && (
          <p className="absolute top-2 left-2 z-10 rounded bg-black/40 px-2 py-0.5 text-xs text-white">
            {label}
          </p>
        )}
        <div className="relative h-64 w-full">
          <Image
            src={current.src}
            alt={current.sourceFileName}
            fill
            sizes="(max-width: 1024px) 100vw, 700px"
            className="object-cover"
          />
        </div>
        <div className="absolute right-2 bottom-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 shadow hover:bg-white"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-red-600 shadow hover:bg-white"
          >
            Remove
          </button>
        </div>
        {pickerOpen && (
          <div className="border-t border-zinc-200 bg-white p-3">
            <MediaTray
              articleId={articleId}
              media={media}
              onUploaded={(m) => {
                onUploaded(m);
                onChange(m.id);
                setPickerOpen(false);
              }}
              onPick={(id) => {
                onChange(id);
                setPickerOpen(false);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      {!pickerOpen ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-200 py-3 text-xs text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-500"
        >
          {label ? `+ ${label}` : '+ Add photo'}
        </button>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
            <p className="text-xs font-medium text-zinc-600">
              {label ?? 'Pick a photo'}
            </p>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Cancel
            </button>
          </div>
          <div className="p-3">
            <MediaTray
              articleId={articleId}
              media={media}
              onUploaded={(m) => {
                onUploaded(m);
                onChange(m.id);
                setPickerOpen(false);
              }}
              onPick={(id) => {
                onChange(id);
                setPickerOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

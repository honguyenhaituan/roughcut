'use client';

import type { ReactNode } from 'react';
import type { ArticleContent } from '@/types';
import { summarize } from '@/lib/article-content';

interface Props {
  content: ArticleContent;
  onSave: () => void;
  exportButton: ReactNode;
}

export function SummaryBar({ content, onSave, exportButton }: Props) {
  const { grounded, unverified, gaps } = summarize(content);

  const handleSave = () => {
    if (
      unverified > 0 &&
      !window.confirm(
        `${unverified} AI-added claim(s) are still unverified. Save anyway?`,
      )
    ) {
      return;
    }
    onSave();
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <span className="text-green-700">{grounded} grounded</span>
        <span className="text-zinc-400">·</span>
        {unverified > 0 ? (
          <span className="font-medium text-amber-600">
            {unverified} AI-added unverified
          </span>
        ) : (
          <span className="text-zinc-500">0 AI-added unverified</span>
        )}
        <span className="text-zinc-400">·</span>
        <span className="text-zinc-500">{gaps} open questions</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Save
        </button>
        {exportButton}
      </div>
    </div>
  );
}

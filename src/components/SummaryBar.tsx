'use client';

import type { ArticleContent } from '@/types';
import { summarize } from '@/lib/article-content';
import { Tooltip } from './Tooltip';

interface Props {
  content: ArticleContent;
}

/** Compact provenance counters for the workspace header. */
export function SummaryBar({ content }: Props) {
  const { grounded, unverified, gaps } = summarize(content);

  return (
    <div className="hidden items-center gap-3 text-xs lg:flex">
      <Tooltip
        tone="green"
        label="Green — grounded claims backed by your source notes"
      >
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="size-1.5 rounded-full bg-green-500" />
          {grounded}
        </span>
      </Tooltip>
      <Tooltip
        tone="amber"
        label="Amber — AI-added claims not in your notes, still unverified"
      >
        <span
          className={`flex items-center gap-1 ${
            unverified > 0 ? 'font-medium text-amber-600' : 'text-zinc-500'
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              unverified > 0 ? 'bg-amber-500' : 'bg-zinc-300'
            }`}
          />
          {unverified}
        </span>
      </Tooltip>
      <Tooltip
        tone="zinc"
        label="Open questions still to resolve before publishing"
      >
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="size-1.5 rounded-full bg-zinc-400" />
          {gaps}
        </span>
      </Tooltip>
    </div>
  );
}

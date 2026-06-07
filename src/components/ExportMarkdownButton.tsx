'use client';

import { useState } from 'react';
import { articleToMarkdown } from '@/lib/markdown';
import type {
  ArticleContent,
  Media,
} from '@/server/validations/article.schema';

interface Props {
  article: { title: string; content: ArticleContent; media?: Media[] };
}

export default function ExportMarkdownButton({ article }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const md = articleToMarkdown(article);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy as Markdown'}
      aria-label="Copy as Markdown"
      className="flex size-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600 transition hover:bg-zinc-50"
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 text-green-600"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

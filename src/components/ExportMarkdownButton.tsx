'use client';

import { useState } from 'react';
import { articleToMarkdown } from '@/lib/markdown';
import type { ArticleContent } from '@/server/validations/article.schema';

interface Props {
  article: { title: string; content: ArticleContent };
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
      className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {copied ? 'Copied!' : 'Copy Markdown'}
    </button>
  );
}

import type { ArticleContent } from '@/server/validations/article.schema';

export function articleToMarkdown(article: {
  title: string;
  content: ArticleContent;
}): string {
  const c = article.content;
  const out: string[] = [`# ${article.title}`, ''];

  if (c.hookSubtitle?.text) out.push(`*${c.hookSubtitle.text}*`, '');
  if (c.intro?.text) out.push(c.intro.text, '');

  for (const s of c.sections) {
    out.push(`## ${s.heading}`, '');
    const body = s.body.map((cl) => cl.text).join(' ');
    if (body) out.push(body, '');
  }

  const list = (title: string, items: { text: string }[]) => {
    if (!items.length) return;
    out.push(`## ${title}`, '');
    for (const i of items) out.push(`- ${i.text}`);
    out.push('');
  };

  if (c.keyFacts.length) {
    out.push('## Key facts', '');
    for (const k of c.keyFacts) out.push(`- **${k.label}:** ${k.value}`);
    out.push('');
  }

  list('Best for', c.bestFor);
  list('Not for', c.notFor);
  list('Ethics & safety', c.ethicsSafety);
  list('Top tips', c.topTips);

  if (c.faq.length) {
    out.push('## FAQ', '');
    for (const f of c.faq) out.push(`**${f.q}**`, '', f.a.text, '');
  }

  return out.join('\n').trim() + '\n';
}

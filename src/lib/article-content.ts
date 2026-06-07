import type { ArticleContent, Claim } from '@/types';

/**
 * Replace a claim anywhere in the content by id.
 * Preserves any extra fields on the original claim (label/value/needsExternalSource)
 * by spreading original first, then the updated values.
 */
export function replaceClaim(
  c: ArticleContent,
  updated: Claim,
): ArticleContent {
  const m = <T extends Claim>(cl: T): T =>
    cl.id === updated.id ? { ...cl, ...updated } : cl;
  return {
    ...c,
    hookSubtitle: m(c.hookSubtitle),
    intro: m(c.intro),
    sections: c.sections.map((s) => ({ ...s, body: s.body.map(m) })),
    keyFacts: c.keyFacts.map(m),
    bestFor: c.bestFor.map(m),
    notFor: c.notFor.map(m),
    ethicsSafety: c.ethicsSafety.map(m),
    topTips: c.topTips.map(m),
    faq: c.faq.map((f) => ({ ...f, a: m(f.a) })),
  };
}

export function allClaims(c: ArticleContent): Claim[] {
  return [
    c.hookSubtitle,
    c.intro,
    ...c.sections.flatMap((s) => s.body),
    ...c.keyFacts,
    ...c.bestFor,
    ...c.notFor,
    ...c.ethicsSafety,
    ...c.topTips,
    ...c.faq.map((f) => f.a),
  ];
}

export function summarize(c: ArticleContent) {
  const claims = allClaims(c);
  return {
    grounded: claims.filter((x) => x.provenance === 'sourced').length,
    unverified: claims.filter((x) => x.provenance === 'ai_added' && !x.verified)
      .length,
    gaps: c.openQuestions.length,
  };
}

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

/**
 * Split a section-body claim: set the target claim's text to `beforeText` and
 * insert `newClaim` immediately after it. Used when the user presses Enter to
 * start a new sentence as its own claim. Returns content unchanged if the
 * section or claim isn't found.
 */
export function splitClaimInSection(
  c: ArticleContent,
  sectionId: string,
  claimId: string,
  beforeText: string,
  newClaim: Claim,
): ArticleContent {
  return {
    ...c,
    sections: c.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const idx = s.body.findIndex((cl) => cl.id === claimId);
      if (idx === -1) return s;
      const body = [...s.body];
      body[idx] = { ...body[idx], text: beforeText };
      body.splice(idx + 1, 0, newClaim);
      return { ...s, body };
    }),
  };
}

/**
 * Remove a claim by id from the places where deleting a single claim is
 * structurally valid: section bodies and the free-list fields. Required single
 * claims (intro/hook) and keyed entries (keyFacts/faq) are left untouched.
 */
export function removeClaimById(c: ArticleContent, id: string): ArticleContent {
  return {
    ...c,
    sections: c.sections.map((s) => ({
      ...s,
      body: s.body.filter((cl) => cl.id !== id),
    })),
    bestFor: c.bestFor.filter((cl) => cl.id !== id),
    notFor: c.notFor.filter((cl) => cl.id !== id),
    ethicsSafety: c.ethicsSafety.filter((cl) => cl.id !== id),
    topTips: c.topTips.filter((cl) => cl.id !== id),
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

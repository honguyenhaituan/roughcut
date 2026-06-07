import { model } from '@/server/llm/client';
import {
  DRAFT_SYSTEM,
  draftUser,
  PLAN_SYSTEM,
  planUser,
} from '@/server/llm/prompts';
import {
  draftOutputSchema,
  planOutputSchema,
  type ArticleContent,
  type Segment,
} from '@/server/validations/article.schema';
import { generateObject } from 'ai';
import 'server-only';

const cid = () => crypto.randomUUID();

export function validateSourceIds(ids: string[], pool: Set<string>): string[] {
  return ids.filter((id) => pool.has(id));
}
export function resolveProvenance<P extends string>(
  provenance: P,
  validatedIds: string[],
): P | 'ai_added' {
  return provenance === 'sourced' && validatedIds.length === 0
    ? 'ai_added'
    : provenance;
}

export async function plan(
  segments: Segment[],
): Promise<{ title: string; articleType: string; content: ArticleContent }> {
  const { object } = await generateObject({
    model: model(),
    schema: planOutputSchema,
    system: PLAN_SYSTEM,
    prompt: planUser(segments),
    maxRetries: 1,
  });
  const pool = new Set(segments.map((s) => s.id));
  const claim = (c: {
    text: string;
    sourceSegmentIds: string[];
    provenance: 'sourced' | 'ai_added';
  }) => {
    const sourceSegmentIds = validateSourceIds(c.sourceSegmentIds, pool);
    return {
      id: cid(),
      text: c.text,
      sourceSegmentIds,
      provenance: resolveProvenance(c.provenance, sourceSegmentIds),
      verified: false,
    };
  };
  const content: ArticleContent = {
    isTravelExperience: object.isTravelExperience,
    hookSubtitle: claim(object.hookSubtitle),
    intro: claim(object.intro),
    sections: object.skeleton.map((s) => ({
      id: cid(),
      heading: s.heading,
      intent: s.intent,
      sourceSegmentIds: validateSourceIds(s.sourceSegmentIds, pool),
      body: [],
      imageId: null,
    })),
    keyFacts: object.keyFacts.map((k) => ({
      ...claim({
        text: k.value,
        sourceSegmentIds: k.sourceSegmentIds,
        provenance: k.provenance,
      }),
      label: k.label,
      value: k.value,
    })),
    bestFor: object.bestFor.map(claim),
    notFor: object.notFor.map(claim),
    ethicsSafety: object.ethicsSafety.map((e) => ({
      ...claim(e),
      needsExternalSource: e.needsExternalSource,
    })),
    topTips: object.topTips.map(claim),
    faq: object.faq.map((f) => ({ id: cid(), q: f.q, a: claim(f.a) })),
    openQuestions: object.openQuestions,
    unassignedSegments: validateSourceIds(object.unassignedSegments, pool),
    heroImageId: null,
  };
  return { title: object.title, articleType: object.articleType, content };
}

export async function draftSection(args: {
  heading: string;
  intent: string;
  hook: string;
  outline: string[];
  segments: Segment[];
  assignedIds: string[];
}) {
  const pool = new Set(args.segments.map((s) => s.id));
  const assigned = args.segments.filter((s) => args.assignedIds.includes(s.id));
  const { object } = await generateObject({
    model: model(),
    schema: draftOutputSchema,
    system: DRAFT_SYSTEM,
    maxRetries: 1,
    prompt: draftUser({
      heading: args.heading,
      intent: args.intent,
      hook: args.hook,
      outline: args.outline,
      segments: assigned.map((s) => ({ id: s.id, text: s.text })),
    }),
  });
  return object.body.map((c) => {
    const sourceSegmentIds = validateSourceIds(c.sourceSegmentIds, pool);
    return {
      id: cid(),
      text: c.text,
      sourceSegmentIds,
      provenance: resolveProvenance(c.provenance, sourceSegmentIds),
      verified: false,
    };
  });
}

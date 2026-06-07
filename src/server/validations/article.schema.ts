import { z } from 'zod';

export const provenanceEnum = z.enum(['sourced', 'ai_added', 'human']);
export const llmProvenance = z.enum(['sourced', 'ai_added']);

export const claimSchema = z.object({
  id: z.string(),
  text: z.string(),
  sourceSegmentIds: z.array(z.string()),
  provenance: provenanceEnum,
  verified: z.boolean(),
});
export type Claim = z.infer<typeof claimSchema>;

export const planOutputSchema = z.object({
  isTravelExperience: z.boolean(),
  reason: z.string().optional(),
  articleType: z.string(),
  purpose: z.string(),
  title: z.string(),
  hookSubtitle: z.object({
    text: z.string(),
    sourceSegmentIds: z.array(z.string()),
    provenance: llmProvenance,
  }),
  intro: z.object({
    text: z.string(),
    sourceSegmentIds: z.array(z.string()),
    provenance: llmProvenance,
  }),
  skeleton: z
    .array(
      z.object({
        heading: z.string(),
        intent: z.string(),
        sourceSegmentIds: z.array(z.string()),
      }),
    )
    .max(8),
  keyFacts: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      sourceSegmentIds: z.array(z.string()),
      provenance: llmProvenance,
    }),
  ),
  bestFor: z.array(
    z.object({
      text: z.string(),
      sourceSegmentIds: z.array(z.string()),
      provenance: llmProvenance,
    }),
  ),
  notFor: z.array(
    z.object({
      text: z.string(),
      sourceSegmentIds: z.array(z.string()),
      provenance: llmProvenance,
    }),
  ),
  ethicsSafety: z.array(
    z.object({
      text: z.string(),
      sourceSegmentIds: z.array(z.string()),
      provenance: llmProvenance,
      needsExternalSource: z.boolean(),
    }),
  ),
  topTips: z.array(
    z.object({
      text: z.string(),
      sourceSegmentIds: z.array(z.string()),
      provenance: llmProvenance,
    }),
  ),
  faq: z.array(
    z.object({
      q: z.string(),
      a: z.object({
        text: z.string(),
        sourceSegmentIds: z.array(z.string()),
        provenance: llmProvenance,
      }),
    }),
  ),
  openQuestions: z.array(z.string()),
  unassignedSegments: z.array(z.string()),
});
export type PlanOutput = z.infer<typeof planOutputSchema>;

export const draftOutputSchema = z.object({
  body: z.array(
    z.object({
      text: z.string(),
      sourceSegmentIds: z.array(z.string()),
      provenance: llmProvenance,
    }),
  ),
});
export type DraftOutput = z.infer<typeof draftOutputSchema>;

export const sectionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  intent: z.string(),
  sourceSegmentIds: z.array(z.string()),
  body: z.array(claimSchema),
  imageId: z.string().nullable(),
  draftError: z.boolean().optional(),
});
export const keyFactSchema = claimSchema.extend({
  label: z.string(),
  value: z.string(),
});
export const contentSchema = z.object({
  hookSubtitle: claimSchema,
  intro: claimSchema,
  sections: z.array(sectionSchema),
  keyFacts: z.array(keyFactSchema),
  bestFor: z.array(claimSchema),
  notFor: z.array(claimSchema),
  ethicsSafety: z.array(
    claimSchema.extend({ needsExternalSource: z.boolean() }),
  ),
  topTips: z.array(claimSchema),
  faq: z.array(z.object({ id: z.string(), q: z.string(), a: claimSchema })),
  openQuestions: z.array(z.string()),
  unassignedSegments: z.array(z.string()),
  isTravelExperience: z.boolean(),
  heroImageId: z.string().nullable(),
});
export type ArticleContent = z.infer<typeof contentSchema>;

export const segmentSchema = z.object({
  id: z.string(),
  text: z.string(),
  fileName: z.string(),
});
export type Segment = z.infer<typeof segmentSchema>;
export const mediaSchema = z.object({
  id: z.string(),
  src: z.string(),
  sourceFileName: z.string(),
  origin: z.enum(['extracted', 'uploaded']),
  mimeType: z.string(),
});
export type Media = z.infer<typeof mediaSchema>;

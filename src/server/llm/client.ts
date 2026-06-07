import 'server-only';
import { createOpenAI } from '@ai-sdk/openai';
import { env } from '@/helpers/env';

// Deferred so OPENAI_API_KEY is only read when a call is made, not at import time.
export const model = () => {
  const openai = createOpenAI({ apiKey: env.openaiApiKey() });
  return openai(env.openaiModel());
};

import 'server-only';
import { createOpenAI } from '@ai-sdk/openai';
import { env } from '@/helpers/env';

// Deferred so LiteLLM creds are only read when a call is made, not at import time.
// .chat() forces the /chat/completions endpoint, which the LiteLLM proxy supports universally
// (the provider's default Responses API may not be proxied).
export const model = () => {
  const openai = createOpenAI({
    apiKey: env.litellmApiKey(),
    baseURL: env.litellmBaseUrl(),
  });
  return openai.chat(env.litellmModel());
};

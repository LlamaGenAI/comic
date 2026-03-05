import { LlamaGenClient } from '../../../src';

export interface ExpressEnv {
  LLAMAGEN_API_KEY?: string;
}

export function createExpressLlamaGenClient(env: ExpressEnv = process.env): LlamaGenClient {
  const apiKey = env.LLAMAGEN_API_KEY;
  if (!apiKey) {
    throw new Error('Missing LLAMAGEN_API_KEY for Express integration demo.');
  }

  return new LlamaGenClient({ apiKey });
}

import { LlamaGenClient } from '../../../src';

export interface ServerEnv {
  LLAMAGEN_API_KEY?: string;
}

export function createServerLlamaGenClient(env: ServerEnv = process.env): LlamaGenClient {
  const apiKey = env.LLAMAGEN_API_KEY;
  if (!apiKey) {
    throw new Error('Missing LLAMAGEN_API_KEY for Next.js integration demo.');
  }

  return new LlamaGenClient({ apiKey });
}

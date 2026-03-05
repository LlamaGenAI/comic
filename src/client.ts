import { HTTPClient } from './http';
import { ComicsResource } from './resources/comics';
import type { LlamaGenClientOptions } from './types';

const DEFAULT_BASE_URL = 'https://api.llamagen.ai/v1';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 500;

export class LlamaGenClient {
  public readonly comic: ComicsResource;
  public readonly comics: ComicsResource;

  constructor(options: LlamaGenClientOptions) {
    if (!options?.apiKey) {
      throw new Error('`apiKey` is required to initialize LlamaGenClient.');
    }

    const http = new HTTPClient({
      apiKey: options.apiKey,
      baseURL: options.baseURL ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelayMs: options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      fetchImpl: options.fetch
    });

    const comicResource = new ComicsResource(http);
    this.comic = comicResource;
    // Backward-compatible alias; prefer `llamagen.comic.*`.
    this.comics = comicResource;
  }
}

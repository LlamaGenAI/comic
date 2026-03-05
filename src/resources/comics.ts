import type {
  ComicArtworkResponse,
  CreateComicParams,
  WaitForCompletionOptions
} from '../types';
import { LlamaGenTimeoutError } from '../errors';
import { HTTPClient } from '../http';

const DEFAULT_SIZE = '1024x1024';
const DEFAULT_PRESET = 'render';
const DEFAULT_DONE_STATUSES = ['SUCCEEDED', 'FAILED', 'PROCESSED', 'COMPLETED'];

export class ComicsResource {
  constructor(private readonly http: HTTPClient) {}

  async create(params: CreateComicParams): Promise<ComicArtworkResponse> {
    assertNonEmpty(params?.prompt, '`prompt` is required and must be a non-empty string.');

    const body = {
      preset: params.preset ?? DEFAULT_PRESET,
      size: params.size ?? DEFAULT_SIZE,
      ...params
    };

    return this.http.request<ComicArtworkResponse>('/comics/generations', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async get(artworkId: string): Promise<ComicArtworkResponse> {
    assertNonEmpty(artworkId, '`artworkId` is required and must be a non-empty string.');
    return this.http.request<ComicArtworkResponse>(`/comics/generations/${artworkId}`, {
      method: 'GET'
    });
  }

  async waitForCompletion(
    artworkId: string,
    options: WaitForCompletionOptions = {}
  ): Promise<ComicArtworkResponse> {
    const intervalMs = options.intervalMs ?? 5000;
    const timeoutMs = options.timeoutMs ?? 180000;
    const doneStatuses = new Set((options.doneStatuses ?? DEFAULT_DONE_STATUSES).map((x) => x.toUpperCase()));

    const start = Date.now();

    for (;;) {
      const result = await this.get(artworkId);
      const status = String(result.status || '').toUpperCase();
      if (doneStatuses.has(status)) {
        return result;
      }

      if (Date.now() - start >= timeoutMs) {
        throw new LlamaGenTimeoutError(
          `Artwork ${artworkId} did not reach a completed status within ${timeoutMs}ms`
        );
      }

      await delay(intervalMs);
    }
  }

  async createAndWait(
    params: CreateComicParams,
    options: WaitForCompletionOptions = {}
  ): Promise<ComicArtworkResponse> {
    const created = await this.create(params);
    return this.waitForCompletion(created.id, options);
  }

  // Backward-compatible aliases for prior SDK naming.
  async createComic(params: CreateComicParams): Promise<ComicArtworkResponse> {
    return this.create(params);
  }

  async getComic(artworkId: string): Promise<ComicArtworkResponse> {
    return this.get(artworkId);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertNonEmpty(value: unknown, message: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(message);
  }
}

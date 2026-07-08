import { LlamaGenTimeoutError } from '../errors';
import { HTTPClient } from '../http';
import type {
  AnimationArtworkResponse,
  CreateAnimationParams,
  WaitForCompletionOptions
} from '../types';

const DEFAULT_DONE_STATUSES = ['SUCCEEDED', 'FAILED', 'PROCESSED', 'COMPLETED', 'CANCELLED'];

export class AnimationsResource {
  constructor(private readonly http: HTTPClient) {}

  async create(params: CreateAnimationParams): Promise<AnimationArtworkResponse> {
    assertNonEmpty(params?.prompt, '`prompt` is required and must be a non-empty string.');

    return this.http.request<AnimationArtworkResponse>('/artworks/generations', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async get(artworkId: string): Promise<AnimationArtworkResponse> {
    assertNonEmpty(artworkId, '`artworkId` is required and must be a non-empty string.');

    return this.http.request<AnimationArtworkResponse>(`/artworks/generations/${artworkId}`, {
      method: 'GET'
    });
  }

  async waitForCompletion(
    artworkId: string,
    options: WaitForCompletionOptions = {}
  ): Promise<AnimationArtworkResponse> {
    const intervalMs = options.intervalMs ?? 5000;
    const timeoutMs = options.timeoutMs ?? 300000;
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
    params: CreateAnimationParams,
    options: WaitForCompletionOptions = {}
  ): Promise<AnimationArtworkResponse> {
    const created = await this.create(params);
    return this.waitForCompletion(created.id, options);
  }
}

function assertNonEmpty(value: unknown, message: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(message);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

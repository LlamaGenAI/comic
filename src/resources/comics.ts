import type {
  BatchCreateItemResult,
  BatchCreateOptions,
  ComicUploadResponse,
  ComicSize,
  ComicArtworkResponse,
  ComicUsage,
  ContinueComicParams,
  CreateComicParams,
  GetComicOptions,
  UpdateComicPanelParams,
  WaitManyOptions,
  WaitForCompletionOptions
} from '../types';
import { LlamaGenTimeoutError } from '../errors';
import { HTTPClient } from '../http';
import { SUPPORTED_COMIC_SIZES } from '../api-types';

const DEFAULT_SIZE: ComicSize = '1024x1024';
const DEFAULT_PRESET = 'neutral';
const DEFAULT_DONE_STATUSES = ['SUCCEEDED', 'FAILED', 'PROCESSED', 'COMPLETED', 'CANCELLED'];
const SUPPORTED_COMIC_SIZE_SET = new Set<string>(SUPPORTED_COMIC_SIZES);

export class ComicsResource {
  constructor(private readonly http: HTTPClient) {}

  async create(params: CreateComicParams): Promise<ComicArtworkResponse> {
    assertNonEmpty(params?.prompt, '`prompt` is required and must be a non-empty string.');
    if (params?.size !== undefined) {
      assertSupportedSize(params.size);
    }
    assertLayoutOptions(params);

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

  async get(artworkId: string, options: GetComicOptions = {}): Promise<ComicArtworkResponse> {
    assertNonEmpty(artworkId, '`artworkId` is required and must be a non-empty string.');
    if (options.page !== undefined) {
      assertNonNegativeInteger(options.page, '`page` must be a non-negative integer.');
    }
    if (options.panel !== undefined) {
      assertNonNegativeInteger(options.panel, '`panel` must be a non-negative integer.');
    }

    return this.http.request<ComicArtworkResponse>(buildPath(`/comics/generations/${artworkId}`, options), {
      method: 'GET'
    });
  }

  async continueWrite(
    generationId: string,
    params: ContinueComicParams
  ): Promise<ComicArtworkResponse> {
    assertNonEmpty(generationId, '`generationId` is required and must be a non-empty string.');
    assertNonEmpty(params?.prompt, '`prompt` is required and must be a non-empty string.');
    assertLayoutOptions(params);

    return this.http.request<ComicArtworkResponse>(`/comics/generations/${generationId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...params,
        action: 'continueWrite'
      })
    });
  }

  async updatePanel(
    generationId: string,
    params: UpdateComicPanelParams
  ): Promise<ComicArtworkResponse> {
    assertNonEmpty(generationId, '`generationId` is required and must be a non-empty string.');
    assertPanelLocator(params);
    assertPanelUpdatePayload(params);

    return this.http.request<ComicArtworkResponse>(`/comics/generations/${generationId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...params,
        action: 'regeneratePanel'
      })
    });
  }

  async usage(): Promise<ComicUsage> {
    return this.http.request<ComicUsage>('/comics/usage', {
      method: 'GET'
    });
  }

  async upload(file: Blob, filename?: string): Promise<ComicUploadResponse> {
    const form = new FormData();
    form.append('file', file, filename);

    return this.http.request<ComicUploadResponse>('/comics/upload', {
      method: 'POST',
      body: form
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

  async createBatch(
    paramsList: CreateComicParams[],
    options: BatchCreateOptions = {}
  ): Promise<BatchCreateItemResult[]> {
    if (!Array.isArray(paramsList) || paramsList.length === 0) {
      throw new TypeError('`paramsList` must be a non-empty array.');
    }

    const concurrency = options.concurrency ?? 3;
    const stopOnError = options.stopOnError ?? false;

    const results = await runWithConcurrency(
      paramsList,
      Math.max(1, concurrency),
      async (input): Promise<BatchCreateItemResult> => {
        try {
          const result = await this.create(input);
          return { input, result };
        } catch (error) {
          if (stopOnError) {
            throw error;
          }
          return { input, error };
        }
      }
    );

    return results;
  }

  async waitForMany(
    artworkIds: string[],
    options: WaitManyOptions = {}
  ): Promise<ComicArtworkResponse[]> {
    if (!Array.isArray(artworkIds) || artworkIds.length === 0) {
      throw new TypeError('`artworkIds` must be a non-empty array.');
    }

    const concurrency = Math.max(1, options.concurrency ?? 3);
    const waitOptions: WaitForCompletionOptions = {
      intervalMs: options.intervalMs,
      timeoutMs: options.timeoutMs,
      doneStatuses: options.doneStatuses
    };

    return runWithConcurrency(artworkIds, concurrency, async (id) =>
      this.waitForCompletion(id, waitOptions)
    );
  }

  // Backward-compatible aliases for prior SDK naming.
  async createComic(params: CreateComicParams): Promise<ComicArtworkResponse> {
    return this.create(params);
  }

  async getComic(artworkId: string): Promise<ComicArtworkResponse> {
    return this.get(artworkId);
  }

  async continueComic(
    generationId: string,
    params: ContinueComicParams
  ): Promise<ComicArtworkResponse> {
    return this.continueWrite(generationId, params);
  }

  async regeneratePanel(
    generationId: string,
    params: UpdateComicPanelParams
  ): Promise<ComicArtworkResponse> {
    return this.updatePanel(generationId, params);
  }

  async updateComicPanel(
    generationId: string,
    params: UpdateComicPanelParams
  ): Promise<ComicArtworkResponse> {
    return this.updatePanel(generationId, params);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  worker: (item: TInput, index: number) => Promise<TOutput>
): Promise<TOutput[]> {
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  async function runner(): Promise<void> {
    for (;;) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) {
        return;
      }
      results[current] = await worker(items[current], current);
    }
  }

  const count = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: count }, () => runner()));
  return results;
}

function assertNonEmpty(value: unknown, message: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(message);
  }
}

function assertSupportedSize(value: string): void {
  if (!SUPPORTED_COMIC_SIZE_SET.has(value)) {
    throw new TypeError(
      `\`size\` must be one of: ${SUPPORTED_COMIC_SIZES.join(', ')}. Received: ${value}`
    );
  }
}

function assertLayoutOptions(params: { fixPanelNum?: number; pagination?: unknown }): void {
  if (params.fixPanelNum !== undefined && params.pagination !== undefined) {
    throw new TypeError('`fixPanelNum` and `pagination` cannot be used together.');
  }

  if (params.fixPanelNum !== undefined) {
    assertIntegerInRange(params.fixPanelNum, 1, 20, '`fixPanelNum` must be an integer from 1 to 20.');
  }

  if (params.pagination !== undefined) {
    const pagination = params.pagination as { totalPages?: unknown; panelsPerPage?: unknown };
    assertIntegerInRange(
      pagination.totalPages,
      1,
      20,
      '`pagination.totalPages` must be an integer from 1 to 20.'
    );
    assertIntegerInRange(
      pagination.panelsPerPage,
      1,
      20,
      '`pagination.panelsPerPage` must be an integer from 1 to 20.'
    );
  }
}

function assertPanelLocator(params: UpdateComicPanelParams): void {
  const panel = params.panel ?? params.panelIndex ?? params.panel_index;
  if (panel === undefined) {
    throw new TypeError('`panel`, `panelIndex`, or `panel_index` is required.');
  }
  assertNonNegativeInteger(panel, '`panel` must be a non-negative integer.');

  const page = params.page ?? params.pageIndex ?? params.page_index;
  if (page !== undefined) {
    assertNonNegativeInteger(page, '`page` must be a non-negative integer.');
  }
}

function assertPanelUpdatePayload(params: UpdateComicPanelParams): void {
  const hasPayload =
    hasNonEmptyString(params.panelPrompt) ||
    hasNonEmptyString(params.prompt) ||
    hasNonEmptyString(params.panel_prompt) ||
    hasNonEmptyString(params.caption) ||
    hasImages(params.images) ||
    hasImageAlias(params.images_url);

  if (!hasPayload) {
    throw new TypeError('One of `panelPrompt`, `prompt`, `images`, or `caption` is required.');
  }
}

function assertNonNegativeInteger(value: unknown, message: string): void {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new TypeError(message);
  }
}

function assertIntegerInRange(value: unknown, min: number, max: number, message: string): void {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) {
    throw new TypeError(message);
  }
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasImages(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => hasNonEmptyString(item));
}

function hasImageAlias(value: unknown): boolean {
  return hasNonEmptyString(value) || hasImages(value);
}

function buildPath(path: string, query: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      search.set(key, String(value));
    }
  }

  const serialized = search.toString();
  return serialized ? `${path}?${serialized}` : path;
}

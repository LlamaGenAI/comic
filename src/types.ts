export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface LlamaGenClientOptions {
  apiKey: string;
  baseURL?: string;
  timeoutMs?: number;
  /** @deprecated Requests are no longer retried automatically. */
  maxRetries?: number;
  /** @deprecated Requests are no longer retried automatically. */
  retryDelayMs?: number;
  fetch?: FetchLike;
}
export type {
  AnimationArtworkResponse,
  AnimationGenerationStatus,
  AnimationVideoOptions,
  ComicAttachment,
  ComicLocation,
  ComicGenerationStatus,
  ComicPagination,
  ComicSize,
  ComicUsage,
  ComicUploadResponse,
  ComicUsageDelta,
  CreateComicParams,
  CreateAnimationParams,
  ContinueComicParams,
  GetComicOptions,
  ComicPanel,
  ComicEntity,
  ComicArtworkResponse,
  UpdateComicPanelParams,
  WaitForCompletionOptions,
  ErrorResponseBody,
  BatchCreateOptions,
  BatchCreateItemResult,
  WaitManyOptions,
  WebhookEvent,
  WebhookEventType,
  WebhookVerificationOptions
} from './api-types';

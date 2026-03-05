export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface LlamaGenClientOptions {
  apiKey: string;
  baseURL?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fetch?: FetchLike;
}
export type {
  ComicGenerationStatus,
  CreateComicParams,
  ComicPanel,
  ComicEntity,
  ComicArtworkResponse,
  WaitForCompletionOptions,
  ErrorResponseBody
} from './api-types';

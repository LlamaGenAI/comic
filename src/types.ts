export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface LlamaGenClientOptions {
  apiKey: string;
  baseURL?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fetch?: FetchLike;
}

export interface CreateComicParams {
  prompt: string;
  size?: string;
  model?: string;
  preset?: string;
  [key: string]: unknown;
}

export interface ComicPanel {
  assetUrl?: string;
  [key: string]: unknown;
}

export interface ComicEntity {
  panels?: ComicPanel[];
  [key: string]: unknown;
}

export interface ComicArtworkResponse {
  id: string;
  status: string;
  output?: string;
  createdAt?: string;
  comics?: ComicEntity[];
  comicData?: unknown;
  [key: string]: unknown;
}

export interface WaitForCompletionOptions {
  intervalMs?: number;
  timeoutMs?: number;
  doneStatuses?: string[];
}

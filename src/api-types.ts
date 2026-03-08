export type ComicGenerationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'PROCESSED'
  | 'COMPLETED'
  | (string & {});

export const SUPPORTED_COMIC_SIZES = [
  '1024x1024',
  '512x768',
  '512x1024',
  '576x1024',
  '768x1024',
  '1024x768',
  '768x512',
  '1024x576',
  '1024x512'
] as const;

export type ComicSize = (typeof SUPPORTED_COMIC_SIZES)[number];

export interface CreateComicParams {
  prompt: string;
  size?: ComicSize;
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
  status: ComicGenerationStatus;
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

export interface ErrorResponseBody {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export interface BatchCreateOptions {
  concurrency?: number;
  stopOnError?: boolean;
}

export interface BatchCreateItemResult {
  input: CreateComicParams;
  result?: ComicArtworkResponse;
  error?: unknown;
}

export interface WaitManyOptions extends WaitForCompletionOptions {
  concurrency?: number;
}

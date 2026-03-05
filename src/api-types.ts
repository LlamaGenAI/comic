export type ComicGenerationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'PROCESSED'
  | 'COMPLETED'
  | (string & {});

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

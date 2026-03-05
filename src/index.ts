export { LlamaGenClient } from './client';
export { LlamaGenAPIError, LlamaGenTimeoutError } from './errors';

export type {
  LlamaGenClientOptions,
  ComicGenerationStatus,
  CreateComicParams,
  ComicArtworkResponse,
  WaitForCompletionOptions,
  ComicEntity,
  ComicPanel,
  ErrorResponseBody,
  BatchCreateOptions,
  BatchCreateItemResult,
  WaitManyOptions
} from './types';

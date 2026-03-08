export { LlamaGenClient } from './client';
export { LlamaGenAPIError, LlamaGenTimeoutError } from './errors';
export { SUPPORTED_COMIC_SIZES } from './api-types';

export type {
  LlamaGenClientOptions,
  ComicGenerationStatus,
  ComicSize,
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

import type { ComicArtworkResponse, CreateComicParams } from '../../../src';
import type { LlamaGenClient } from '../../../src/client';
import { createServerLlamaGenClient } from './client';

export interface ComicSDKService {
  createGeneration(params: CreateComicParams): Promise<ComicArtworkResponse>;
  getGeneration(id: string): Promise<ComicArtworkResponse>;
  createAndWait(params: CreateComicParams): Promise<ComicArtworkResponse>;
}

export function createComicSDKService(client: Pick<LlamaGenClient, 'comic'>): ComicSDKService {
  return {
    createGeneration(params) {
      return client.comic.create(params);
    },
    getGeneration(id) {
      return client.comic.get(id);
    },
    createAndWait(params) {
      return client.comic.createAndWait(params);
    }
  };
}

export function createDefaultComicSDKService(): ComicSDKService {
  return createComicSDKService(createServerLlamaGenClient());
}

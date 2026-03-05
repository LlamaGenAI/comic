import type { ComicArtworkResponse, CreateComicParams } from '../../../src';
import type { LlamaGenClient } from '../../../src/client';

export interface ComicsService {
  createGeneration(params: CreateComicParams): Promise<ComicArtworkResponse>;
  getGeneration(id: string): Promise<ComicArtworkResponse>;
}

export function createComicsService(client: Pick<LlamaGenClient, 'comic'>): ComicsService {
  return {
    createGeneration(params) {
      return client.comic.create(params);
    },
    getGeneration(id) {
      return client.comic.get(id);
    }
  };
}

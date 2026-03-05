import type { ComicArtworkResponse, CreateComicParams } from '../../../src';
import type { LlamaGenClient } from '../../../src/client';

export interface ExpressComicService {
  create(params: CreateComicParams): Promise<ComicArtworkResponse>;
  get(id: string): Promise<ComicArtworkResponse>;
  createAndWait(params: CreateComicParams): Promise<ComicArtworkResponse>;
}

export function createExpressComicService(
  client: Pick<LlamaGenClient, 'comic'>
): ExpressComicService {
  return {
    create(params) {
      return client.comic.create(params);
    },
    get(id) {
      return client.comic.get(id);
    },
    createAndWait(params) {
      return client.comic.createAndWait(params);
    }
  };
}

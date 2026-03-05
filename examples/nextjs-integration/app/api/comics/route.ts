import type { CreateComicParams } from '../../../../../src';
import { createServerLlamaGenClient } from '../../../lib/client';
import { createComicsService } from '../../../lib/comics-service';

type CreateFn = (params: CreateComicParams) => Promise<unknown>;

export function createPostHandler(deps: { createGeneration: CreateFn }) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const payload = (await request.json()) as CreateComicParams;
      if (!payload?.prompt || typeof payload.prompt !== 'string') {
        return Response.json({ error: '`prompt` is required' }, { status: 400 });
      }

      const data = await deps.createGeneration(payload);
      return Response.json(data, { status: 200 });
    } catch (error) {
      return Response.json(
        {
          error: 'Failed to create comic generation',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  };
}

export async function POST(request: Request): Promise<Response> {
  const service = createComicsService(createServerLlamaGenClient());
  return createPostHandler({ createGeneration: service.createGeneration })(request);
}

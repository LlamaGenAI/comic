import { createServerLlamaGenClient } from '../../../../lib/client';
import { createComicsService } from '../../../../lib/comics-service';

type GetFn = (id: string) => Promise<unknown>;

export function createGetByIdHandler(deps: { getGeneration: GetFn }) {
  return async function GET(
    _request: Request,
    context: { params: { id?: string } }
  ): Promise<Response> {
    try {
      const id = context?.params?.id;
      if (!id) {
        return Response.json({ error: '`id` is required' }, { status: 400 });
      }

      const data = await deps.getGeneration(id);
      return Response.json(data, { status: 200 });
    } catch (error) {
      return Response.json(
        {
          error: 'Failed to fetch comic generation',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  };
}

export async function GET(
  request: Request,
  context: { params: { id?: string } }
): Promise<Response> {
  const service = createComicsService(createServerLlamaGenClient());
  return createGetByIdHandler({ getGeneration: service.getGeneration })(request, context);
}

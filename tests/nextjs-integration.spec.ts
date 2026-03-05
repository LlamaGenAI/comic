import { describe, expect, test, vi } from 'vitest';
import { createServerLlamaGenClient } from '../examples/nextjs-integration/lib/client';
import { createComicsService } from '../examples/nextjs-integration/lib/comics-service';
import { createPostHandler } from '../examples/nextjs-integration/app/api/comics/route';
import { createGetByIdHandler } from '../examples/nextjs-integration/app/api/comics/[id]/route';

describe('nextjs integration demo', () => {
  test('creates server client from LLAMAGEN_API_KEY', () => {
    const client = createServerLlamaGenClient({ LLAMAGEN_API_KEY: 'x-key' });
    expect(client).toBeDefined();
  });

  test('supports WEBTOON_API_KEY fallback', () => {
    const client = createServerLlamaGenClient({ WEBTOON_API_KEY: 'fallback-key' });
    expect(client).toBeDefined();
  });

  test('throws when api key is missing', () => {
    expect(() => createServerLlamaGenClient({})).toThrow('Missing LLAMAGEN_API_KEY');
  });

  test('comics service proxies SDK methods', async () => {
    const client = {
      comics: {
        create: vi.fn().mockResolvedValue({ id: 'gen_1', status: 'PENDING' }),
        get: vi.fn().mockResolvedValue({ id: 'gen_1', status: 'SUCCEEDED' })
      }
    };

    const service = createComicsService(client as never);
    const created = await service.createGeneration({ prompt: 'demo prompt' });
    const fetched = await service.getGeneration('gen_1');

    expect(created.id).toBe('gen_1');
    expect(fetched.status).toBe('SUCCEEDED');
    expect(client.comics.create).toHaveBeenCalledWith({ prompt: 'demo prompt' });
    expect(client.comics.get).toHaveBeenCalledWith('gen_1');
  });

  test('POST handler validates prompt', async () => {
    const handler = createPostHandler({
      createGeneration: vi.fn()
    });

    const request = new Request('http://localhost/api/comics', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await handler(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: '`prompt` is required' });
  });

  test('POST handler returns generated payload', async () => {
    const handler = createPostHandler({
      createGeneration: vi.fn().mockResolvedValue({ id: 'gen_2', status: 'PENDING' })
    });

    const request = new Request('http://localhost/api/comics', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'hello world' })
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'gen_2' });
  });

  test('GET-by-id handler validates id', async () => {
    const handler = createGetByIdHandler({
      getGeneration: vi.fn()
    });

    const response = await handler(new Request('http://localhost/api/comics'), {
      params: {}
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: '`id` is required' });
  });

  test('GET-by-id handler returns generation payload', async () => {
    const handler = createGetByIdHandler({
      getGeneration: vi.fn().mockResolvedValue({ id: 'gen_9', status: 'SUCCEEDED' })
    });

    const response = await handler(new Request('http://localhost/api/comics/gen_9'), {
      params: { id: 'gen_9' }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'gen_9', status: 'SUCCEEDED' });
  });
});

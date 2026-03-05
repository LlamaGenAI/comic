import { describe, expect, test, vi } from 'vitest';
import { createServerLlamaGenClient } from '../examples/nextjs-integration/lib/client';
import { createComicSDKService } from '../examples/nextjs-integration/lib/comic-sdk';

describe('nextjs integration demo (direct SDK)', () => {
  test('creates server client from LLAMAGEN_API_KEY', () => {
    const client = createServerLlamaGenClient({ LLAMAGEN_API_KEY: 'x-key' });
    expect(client).toBeDefined();
  });

  test('throws when api key is missing', () => {
    expect(() => createServerLlamaGenClient({})).toThrow('Missing LLAMAGEN_API_KEY');
  });

  test('sdk service proxies create/get/createAndWait', async () => {
    const client = {
      comic: {
        create: vi.fn().mockResolvedValue({ id: 'gen_1', status: 'PENDING' }),
        get: vi.fn().mockResolvedValue({ id: 'gen_1', status: 'SUCCEEDED' }),
        createAndWait: vi.fn().mockResolvedValue({ id: 'gen_2', status: 'SUCCEEDED' })
      }
    };

    const service = createComicSDKService(client as never);

    const created = await service.createGeneration({ prompt: 'demo prompt' });
    const fetched = await service.getGeneration('gen_1');
    const waited = await service.createAndWait({ prompt: 'poll me' });

    expect(created.id).toBe('gen_1');
    expect(fetched.status).toBe('SUCCEEDED');
    expect(waited.id).toBe('gen_2');
    expect(client.comic.create).toHaveBeenCalledWith({ prompt: 'demo prompt' });
    expect(client.comic.get).toHaveBeenCalledWith('gen_1');
    expect(client.comic.createAndWait).toHaveBeenCalledWith({ prompt: 'poll me' });
  });
});

import { describe, expect, test, vi } from 'vitest';
import { createExpressLlamaGenClient } from '../examples/express-integration/src/client';
import { createExpressComicService } from '../examples/express-integration/src/comic-service';

describe('express integration demo (direct SDK)', () => {
  test('creates server client from LLAMAGEN_API_KEY', () => {
    const client = createExpressLlamaGenClient({ LLAMAGEN_API_KEY: 'x-key' });
    expect(client).toBeDefined();
  });

  test('throws when api key is missing', () => {
    expect(() => createExpressLlamaGenClient({})).toThrow('Missing LLAMAGEN_API_KEY');
  });

  test('service proxies create/get/createAndWait', async () => {
    const client = {
      comic: {
        create: vi.fn().mockResolvedValue({ id: 'gen_1', status: 'PENDING' }),
        get: vi.fn().mockResolvedValue({ id: 'gen_1', status: 'SUCCEEDED' }),
        createAndWait: vi.fn().mockResolvedValue({ id: 'gen_2', status: 'SUCCEEDED' })
      }
    };

    const service = createExpressComicService(client as never);

    const created = await service.create({ prompt: 'a city hero story' });
    const fetched = await service.get('gen_1');
    const waited = await service.createAndWait({ prompt: 'two friends in space' });

    expect(created.id).toBe('gen_1');
    expect(fetched.status).toBe('SUCCEEDED');
    expect(waited.id).toBe('gen_2');
    expect(client.comic.create).toHaveBeenCalledWith({ prompt: 'a city hero story' });
    expect(client.comic.get).toHaveBeenCalledWith('gen_1');
    expect(client.comic.createAndWait).toHaveBeenCalledWith({ prompt: 'two friends in space' });
  });
});

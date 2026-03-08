import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { LlamaGenClient } from '../src';
import { LlamaGenAPIError, LlamaGenTimeoutError } from '../src/errors';
import type { FetchLike } from '../src/types';

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

describe('LlamaGenClient', () => {
  let fetchMock: ReturnType<typeof vi.fn<FetchLike>>;

  beforeEach(() => {
    fetchMock = vi.fn<FetchLike>();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('throws if apiKey is missing', () => {
    expect(() => {
      new LlamaGenClient({ apiKey: '' });
    }).toThrow('`apiKey` is required');
  });

  test('keeps `comics` as backward-compatible alias to `comic`', () => {
    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    expect(llamagen.comics).toBe(llamagen.comic);
  });

  test('creates comic with default preset and size', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'LOADING' }));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock
    });

    await llamagen.comic.create({ prompt: 'a cat and a dog' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.llamagen.ai/v1/comics/generations');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json'
    });

    const parsed = JSON.parse(String(init?.body));
    expect(parsed).toMatchObject({
      prompt: 'a cat and a dog',
      preset: 'neutral',
      size: '1024x1024'
    });
  });

  test('throws on empty prompt before request is sent', async () => {
    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await expect(llamagen.comic.create({ prompt: '   ' })).rejects.toThrow('`prompt` is required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('throws on unsupported size before request is sent', async () => {
    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await expect(
      llamagen.comic.create({ prompt: 'hero in city', size: '999x999' as never })
    ).rejects.toThrow('`size` must be one of');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('gets comic by artwork id', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'PROCESSED' }));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock
    });

    const result = await llamagen.comic.get('cm_1');
    expect(result.id).toBe('cm_1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.llamagen.ai/v1/comics/generations/cm_1');
    expect(init?.method).toBe('GET');
  });

  test('throws on empty artworkId before request is sent', async () => {
    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await expect(llamagen.comic.get('')).rejects.toThrow('`artworkId` is required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('supports backward-compatible aliases', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'LOADING' }));
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'PROCESSED' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });

    await llamagen.comic.createComic({ prompt: 'legacy call' });
    const result = await llamagen.comic.getComic('cm_1');

    expect(result.status).toBe('PROCESSED');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('waitForCompletion polls until done status', async () => {
    vi.useFakeTimers();

    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'LOADING' }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'PROCESSED' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });

    const pending = llamagen.comic.waitForCompletion('cm_1', {
      intervalMs: 10,
      timeoutMs: 1000
    });

    await vi.advanceTimersByTimeAsync(10);

    const result = await pending;
    expect(result.status).toBe('PROCESSED');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('createAndWait creates then polls', async () => {
    vi.useFakeTimers();

    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ id: 'cm_created', status: 'LOADING' }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'cm_created', status: 'LOADING' }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'cm_created', status: 'COMPLETED' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });

    const pending = llamagen.comic.createAndWait(
      { prompt: 'storm over city' },
      { intervalMs: 10, timeoutMs: 1000 }
    );

    await vi.advanceTimersByTimeAsync(20);
    const result = await pending;

    expect(result.id).toBe('cm_created');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('waitForCompletion returns immediately on FAILED status', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'FAILED' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    const result = await llamagen.comic.waitForCompletion('cm_1');

    expect(result.status).toBe('FAILED');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('throws api error with response data', async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ error: 'forbidden' }, 403)
    );

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });

    const err = await llamagen.comic.get('cm_1').catch((e) => e as LlamaGenAPIError);
    expect(err).toBeInstanceOf(LlamaGenAPIError);
    expect(err.status).toBe(403);
  });

  test('throws timeout error when artwork does not complete in time', async () => {
    vi.useFakeTimers();

    fetchMock.mockImplementation(async () =>
      createJsonResponse({ id: 'cm_1', status: 'LOADING' })
    );

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });

    const pending = llamagen.comic.waitForCompletion('cm_1', {
      intervalMs: 10,
      timeoutMs: 15
    });

    const expectation = expect(pending).rejects.toBeInstanceOf(LlamaGenTimeoutError);
    await vi.advanceTimersByTimeAsync(20);
    await expectation;
  });

  test('retries once on 500 and then succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ error: 'server error' }, 500))
      .mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'PROCESSED' }));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock,
      maxRetries: 1,
      retryDelayMs: 0
    });

    const result = await llamagen.comic.get('cm_1');
    expect(result.id).toBe('cm_1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('does not retry on 400 responses', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: 'bad request' }, 400));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock,
      maxRetries: 3,
      retryDelayMs: 0
    });

    const err = await llamagen.comic.get('cm_1').catch((e) => e as LlamaGenAPIError);
    expect(err).toBeInstanceOf(LlamaGenAPIError);
    expect(err.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('createBatch returns per-item errors when stopOnError is false', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ id: 'gen_1', status: 'PENDING' }))
      .mockResolvedValueOnce(createJsonResponse({ error: 'bad request' }, 400))
      .mockResolvedValueOnce(createJsonResponse({ id: 'gen_3', status: 'PENDING' }));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock
    });

    const results = await llamagen.comic.createBatch(
      [{ prompt: 'a' }, { prompt: 'b' }, { prompt: 'c' }],
      { concurrency: 2 }
    );

    expect(results).toHaveLength(3);
    expect(results[0].result?.id).toBe('gen_1');
    expect(results[1].error).toBeDefined();
    expect(results[2].result?.id).toBe('gen_3');
  });

  test('createBatch throws when stopOnError is true', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: 'forbidden' }, 403));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock
    });

    await expect(
      llamagen.comic.createBatch([{ prompt: 'a' }], { stopOnError: true })
    ).rejects.toBeInstanceOf(LlamaGenAPIError);
  });

  test('waitForMany waits for all ids', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ id: 'a1', status: 'SUCCEEDED' }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'a2', status: 'SUCCEEDED' }));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock
    });

    const results = await llamagen.comic.waitForMany(['a1', 'a2'], { concurrency: 2 });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('a1');
    expect(results[1].id).toBe('a2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

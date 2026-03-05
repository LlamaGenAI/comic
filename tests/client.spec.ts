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
      preset: 'render',
      size: '1024x1024'
    });
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
});

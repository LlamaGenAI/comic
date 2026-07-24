import { createHmac } from 'node:crypto';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { constructWebhookEvent, LlamaGenClient, verifyWebhookSignature } from '../src';
import { LlamaGenAPIError, LlamaGenTimeoutError, LlamaGenWebhookSignatureError } from '../src/errors';
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
    expect(llamagen.animations).toBe(llamagen.animation);
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

  test('creates comic with latest structured fields', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'LOADING' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await llamagen.comic.create({
      prompt: 'a two page mystery',
      style: 'manga',
      pagination: { totalPages: 2, panelsPerPage: 4 },
      comicRoles: [{ name: 'Leo', image: 'https://example.com/leo.png' }],
      comicLocations: [{ name: 'Dreamwood Forest', image: 'https://example.com/forest.png' }],
      attachments: [{ type: 'image', url: 'https://example.com/reference.png' }],
      language: 'en',
      upscale: '2K'
    });

    const parsed = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(parsed).toMatchObject({
      prompt: 'a two page mystery',
      style: 'manga',
      pagination: { totalPages: 2, panelsPerPage: 4 },
      language: 'en',
      upscale: '2K'
    });
    expect(parsed.comicRoles[0].name).toBe('Leo');
  });

  test('rejects conflicting comic layout modes', async () => {
    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });

    await expect(
      llamagen.comic.create({
        prompt: 'conflicting layout',
        fixPanelNum: 4,
        pagination: { totalPages: 2, panelsPerPage: 4 }
      })
    ).rejects.toThrow('`fixPanelNum` and `pagination` cannot be used together');
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

  test('gets a specific comic panel with query parameters', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'PROCESSED' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await llamagen.comic.get('cm_1', { page: 1, panel: 2 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.llamagen.ai/v1/comics/generations/cm_1?page=1&panel=2');
    expect(init?.method).toBe('GET');
  });

  test('continues an existing comic', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'LOADING' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await llamagen.comic.continueWrite('cm_1', {
      prompt: 'continue into the hidden arcade',
      fixPanelNum: 4,
      attachments: [{ type: 'image', url: 'https://example.com/reference.png' }]
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.llamagen.ai/v1/comics/generations/cm_1');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      action: 'continueWrite',
      prompt: 'continue into the hidden arcade',
      fixPanelNum: 4
    });
  });

  test('updates a single comic panel', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'cm_1', status: 'LOADING' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await llamagen.comic.updatePanel('cm_1', {
      page: 0,
      panel: 2,
      panelPrompt: 'make Leo look hopeful'
    });

    const parsed = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(parsed).toMatchObject({
      action: 'regeneratePanel',
      page: 0,
      panel: 2,
      panelPrompt: 'make Leo look hopeful'
    });
  });

  test('rejects panel update without revised prompt, images, or caption', async () => {
    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });

    await expect(llamagen.comic.updatePanel('cm_1', { panel: 1 })).rejects.toThrow(
      'One of `panelPrompt`, `prompt`, `images`, or `caption` is required'
    );
    expect(fetchMock).not.toHaveBeenCalled();
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

  test('gets comic api usage', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ apiUsageCount: 2, apiMaxUsage: 10 }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    const usage = await llamagen.comic.usage();

    expect(usage.apiUsageCount).toBe(2);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.llamagen.ai/v1/comics/usage');
  });

  test('uploads comic reference assets without forcing json content type', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ fileUrl: 'https://cdn.example.com/ref.png' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    const response = await llamagen.comic.upload(new Blob(['image-bytes'], { type: 'image/png' }), 'ref.png');

    const [, init] = fetchMock.mock.calls[0];
    expect(response.fileUrl).toBe('https://cdn.example.com/ref.png');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.llamagen.ai/v1/comics/upload');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(FormData);
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-key' });
    expect(init?.headers).not.toHaveProperty('Content-Type');
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

  test('accepts maxRetries but does not retry a failed create request', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: 'server error' }, 500));

    const llamagen = new LlamaGenClient({
      apiKey: 'test-key',
      fetch: fetchMock,
      maxRetries: 1,
      retryDelayMs: 0
    });

    const err = await llamagen.comic
      .create({ prompt: 'a cat' })
      .catch((e) => e as LlamaGenAPIError);
    expect(err).toBeInstanceOf(LlamaGenAPIError);
    expect(err.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  test('creates animation generation with video options', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'anim_1', status: 'LOADING' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    await llamagen.animation.create({
      prompt: 'a hero crosses a neon city',
      videoOptions: {
        duration: 5,
        resolution: '720p',
        aspect_ratio: '16:9',
        image: 'https://example.com/first-frame.png',
        last_frame_image: 'https://example.com/last-frame.png'
      }
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.llamagen.ai/v1/artworks/generations');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      prompt: 'a hero crosses a neon city',
      videoOptions: {
        duration: 5,
        resolution: '720p',
        aspect_ratio: '16:9'
      }
    });
  });

  test('gets animation generation status', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 'anim_1', status: 'PROCESSED' }));

    const llamagen = new LlamaGenClient({ apiKey: 'test-key', fetch: fetchMock });
    const result = await llamagen.animation.get('anim_1');

    expect(result.status).toBe('PROCESSED');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.llamagen.ai/v1/artworks/generations/anim_1');
  });

  test('verifies LlamaGen webhook signatures', () => {
    const payload = JSON.stringify({
      type: 'comic.generation.completed',
      data: { id: 'cm_1', status: 'PROCESSED' }
    });
    const secret = 'whsec_test';
    const timestamp = '1715510400';
    const digest = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
    const headers = {
      'X-Llama-Webhook-Id': 'evt_1',
      'X-Llama-Webhook-Timestamp': timestamp,
      'X-Llama-Webhook-Signature': `v1=${digest}`,
      'X-Llama-Webhook-Request-Id': 'req_1'
    };

    expect(verifyWebhookSignature(payload, headers, secret, { now: 1715510400 })).toBe(true);

    const event = constructWebhookEvent(payload, headers, secret, { now: 1715510400 });
    expect(event.id).toBe('evt_1');
    expect(event.requestId).toBe('req_1');
    expect(event.type).toBe('comic.generation.completed');
  });

  test('throws for invalid webhook signatures', () => {
    const payload = JSON.stringify({ type: 'comic.generation.failed', data: {} });
    const headers = {
      'X-Llama-Webhook-Timestamp': '1715510400',
      'X-Llama-Webhook-Signature': 'v1=bad'
    };

    expect(verifyWebhookSignature(payload, headers, 'whsec_test', { now: 1715510400 })).toBe(false);
    expect(() => constructWebhookEvent(payload, headers, 'whsec_test', { now: 1715510400 })).toThrow(
      LlamaGenWebhookSignatureError
    );
  });
});

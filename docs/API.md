# API Reference

Base URL: `https://api.llamagen.ai/v1`

Type definitions for payloads and responses live in:

- [`../src/api-types.ts`](../src/api-types.ts)

## Client

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({ apiKey: 'YOUR_API_KEY' });
```

Optional client settings:

- `timeoutMs`: request timeout in ms (default `30000`)
- `maxRetries`: retry count for `429`/`5xx` responses (default `2`)
- `retryDelayMs`: base delay between retries in ms (default `500`)

## `llamagen.comic.create(params)`

Creates a comic generation task.

```ts
const created = await llamagen.comic.create({
  prompt: 'An epic battle in a cyberpunk city',
  preset: 'render',
  size: '1024x1024'
});
```

## `llamagen.comic.get(artworkId)`

Gets generation detail by id.

Input validation:

- `create(...)` throws `TypeError` if `prompt` is empty
- `get(...)` throws `TypeError` if `artworkId` is empty

```ts
const artwork = await llamagen.comic.get('cm23iyz3r0001le03m39ykh8v');
```

## `llamagen.comic.waitForCompletion(artworkId, options?)`

Polls until one of done statuses is reached.

```ts
const done = await llamagen.comic.waitForCompletion('cm23iyz3r0001le03m39ykh8v', {
  intervalMs: 5000,
  timeoutMs: 180000
});
```

Default terminal statuses: `SUCCEEDED`, `FAILED`, `PROCESSED`, `COMPLETED`.

## `llamagen.comic.createAndWait(params, options?)`

One-shot create and poll.

```ts
const done = await llamagen.comic.createAndWait({
  prompt: 'A detective story in Tokyo'
});
```

## Backward-compatible aliases

```ts
await llamagen.comic.createComic({ prompt: 'legacy path' });
await llamagen.comic.getComic('cm123');
```

## HTTP (fetch) Example

```ts
const createdRes = await fetch('https://api.llamagen.ai/v1/comics/generations', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.LLAMAGEN_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A fox detective in Tokyo',
    preset: 'render',
    size: '1024x1024'
  })
});

const created = await createdRes.json();

const detailRes = await fetch(
  `https://api.llamagen.ai/v1/comics/generations/${created.id}`,
  {
    headers: {
      Authorization: `Bearer ${process.env.LLAMAGEN_API_KEY}`
    }
  }
);

const detail = await detailRes.json();
```

### HTTP Request / Response Notes

`POST /comics/generations` request body:

- `prompt: string` required
- `preset?: string` optional (default `render`)
- `size?: string` optional (example `1024x1024`)
- `model?: string` optional

`POST /comics/generations` response (example):

```json
{
  "id": "gen_123456789",
  "status": "PENDING",
  "createdAt": "2026-03-05T00:00:00Z"
}
```

`GET /comics/generations/:id` response (example):

```json
{
  "id": "gen_123456789",
  "status": "SUCCEEDED",
  "output": "https://cdn.llamagen.ai/comics/gen_123456789.webp",
  "createdAt": "2026-03-05T00:00:00Z"
}
```

## cURL Example

Create generation:

```bash
curl -X POST https://api.llamagen.ai/v1/comics/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A fox detective in Tokyo",
    "preset": "render",
    "size": "1024x1024"
  }'
```

Get generation by ID:

```bash
curl -X GET https://api.llamagen.ai/v1/comics/generations/YOUR_GENERATION_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Framework Integrations

- Next.js direct SDK demo: [`../examples/nextjs-integration`](../examples/nextjs-integration)
- Express direct SDK demo: [`../examples/express-integration`](../examples/express-integration)

# API Reference

Base URL: `https://api.llamagen.ai/v1`

This package covers LlamaGen's Comic API and Animation API. Type definitions live in [`../src/api-types.ts`](../src/api-types.ts).

## Client

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({
  apiKey: process.env.LLAMAGEN_API_KEY!,
  timeoutMs: 30000
});
```

## Comic API

### `llamagen.comic.create(params)`

Creates a comic generation through `POST /comics/generations`.

```ts
const created = await llamagen.comic.create({
  prompt: 'A 4-panel comic about Leo finding a glowing key in a quiet library.',
  style: 'manga',
  fixPanelNum: 4
});
```

Supported input families:

- Story input: `prompt`, `promptUrl`, `style`, `preset`, `size`.
- Layout: `fixPanelNum` for one page, or `pagination.totalPages` plus `pagination.panelsPerPage` for multi-page mode.
- Continuity references: `comicRoles`, `comicLocations`, `images`, `attachments`.
- Output controls: `language`, `upscale`.

The SDK validates that `prompt` is non-empty, supported `size` values are used, and `fixPanelNum` is not mixed with `pagination`.

### `llamagen.comic.get(id, options?)`

Gets a generation through `GET /comics/generations/{generationId}`.

```ts
const generation = await llamagen.comic.get('gen_123');
const singlePanel = await llamagen.comic.get('gen_123', { page: 0, panel: 2 });
```

`page` and `panel` are zero-based.

### `llamagen.comic.continueWrite(id, params)`

Extends an existing story through `PATCH /comics/generations/{generationId}` with `action: "continueWrite"`.

```ts
await llamagen.comic.continueWrite('gen_123', {
  prompt: 'The two friends walk deeper into the neon city and find a hidden arcade.',
  pagination: { totalPages: 1, panelsPerPage: 4 },
  attachments: [{ type: 'image', url: 'https://example.com/reference.png' }]
});
```

### `llamagen.comic.updatePanel(id, params)`

Regenerates one panel through `PATCH /comics/generations/{generationId}` with `action: "regeneratePanel"`.

```ts
await llamagen.comic.updatePanel('gen_123', {
  page: 0,
  panel: 2,
  panelPrompt: 'Make Leo look more hopeful and keep the same orange wizard robe.'
});
```

Accepted aliases include `panelIndex`, `panel_index`, `pageIndex`, `page_index`, `prompt`, `panel_prompt`, and `images_url`.

### Usage, Uploads, and Polling

```ts
const usage = await llamagen.comic.usage();
const upload = await llamagen.comic.upload(file, 'reference.png');
const done = await llamagen.comic.waitForCompletion('gen_123');
const createdAndDone = await llamagen.comic.createAndWait({ prompt: 'A detective fox in Tokyo.' });
```

Batch helpers:

- `llamagen.comic.createBatch(paramsList, { concurrency, stopOnError })`
- `llamagen.comic.waitForMany(ids, { concurrency, intervalMs, timeoutMs })`

## Animation API

### `llamagen.animation.create(params)`

Creates a video artwork through `POST /artworks/generations`.

```ts
const created = await llamagen.animation.create({
  prompt: 'A heroic fox detective walks through neon rain, cinematic camera move.',
  videoOptions: {
    duration: 5,
    resolution: '720p',
    aspect_ratio: '16:9',
    image: 'https://example.com/first-frame.png',
    last_frame_image: 'https://example.com/last-frame.png',
    reference_images: ['https://example.com/character.png']
  }
});
```

Animation methods:

- `llamagen.animation.create(params)`
- `llamagen.animation.get(id)`
- `llamagen.animation.waitForCompletion(id, options?)`
- `llamagen.animation.createAndWait(params, options?)`

Use this namespace for text-to-video, image-to-video, storyboard-to-video, and reference-driven animation workflows.

## Webhooks

```ts
import { constructWebhookEvent } from 'comic';

const event = constructWebhookEvent(rawBody, headers, process.env.LLAMAGEN_WEBHOOK_SECRET!);
```

Supported event names include:

- `comic.generation.created`
- `comic.generation.updated`
- `comic.generation.completed`
- `comic.generation.failed`

Headers verified by the SDK:

- `X-Llama-Webhook-Id`
- `X-Llama-Webhook-Timestamp`
- `X-Llama-Webhook-Signature`
- `X-Llama-Webhook-Request-Id`

## Direct HTTP

Comic endpoints:

- `POST /comics/generations`
- `GET /comics/generations/{generationId}`
- `PATCH /comics/generations/{generationId}`
- `GET /comics/usage`
- `POST /comics/upload`

Animation endpoints:

- `POST /artworks/generations`
- `GET /artworks/generations/{id}`

```bash
curl -X POST https://api.llamagen.ai/v1/comics/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A fox detective in Tokyo.",
    "style": "manga",
    "fixPanelNum": 4
  }'
```

## MCP

Remote MCP endpoint:

```text
https://llamagen.ai/api/mcp
```

Available MCP tools:

- `create_comic_generation`
- `get_comic_generation_status`
- `get_api_usage`

## Framework Integrations

- Next.js direct SDK demo: [`../examples/nextjs-integration`](../examples/nextjs-integration)
- Express direct SDK demo: [`../examples/express-integration`](../examples/express-integration)

## MCP Usage

Use MCP Streamable HTTP endpoint:

```text
https://llamagen.ai/api/mcp
```

Authorization:

```http
Authorization: Bearer YOUR_API_KEY
```

Available tools:

- `create_comic_generation`
- `get_comic_generation_status`
- `get_api_usage`

Client config example:

```json
{
  "mcpServers": {
    "llamagen": {
      "url": "https://llamagen.ai/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

Cursor setup:

1. Go to Cursor MCP settings.
2. Add a new Streamable HTTP server.
3. Set URL to `https://llamagen.ai/api/mcp`.
4. Add header `Authorization: Bearer YOUR_API_KEY`.
5. Confirm tool list is visible.

OAuth metadata endpoint:

```text
https://llamagen.ai/.well-known/oauth-protected-resource
```

# comic

[![CI](https://github.com/LlamaGenAI/comic/actions/workflows/ci.yml/badge.svg)](https://github.com/LlamaGenAI/comic/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/comic.svg)](https://www.npmjs.com/package/comic)
[![npm downloads](https://img.shields.io/npm/dm/comic.svg)](https://www.npmjs.com/package/comic)

Official JavaScript/TypeScript SDK for LlamaGen's Comic API and Animation API.

Homepage: [https://llamagen.ai/comic-api](https://llamagen.ai/comic-api)

## Install

```bash
npm install comic
```

## Quick Start

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({
  apiKey: process.env.LLAMAGEN_API_KEY!
});

const created = await llamagen.comic.create({
  prompt: 'A 4-panel comic about Leo finding a glowing key in a quiet library.',
  style: 'manga',
  fixPanelNum: 4
});

const done = await llamagen.comic.waitForCompletion(created.id);
console.log(done.status, done.comics);
```

## Client

```ts
const llamagen = new LlamaGenClient({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'https://api.llamagen.ai/v1',
  timeoutMs: 30000,
  maxRetries: 2,
  retryDelayMs: 500
});
```

The SDK works in Node.js 18+, modern browsers, serverless runtimes, and test environments that provide `fetch`. Pass `fetch` in client options to use a custom transport.

## Comic API

Use `llamagen.comic` to create comics, manga, webtoons, storyboards, consistent-character pages, and panel edits.

```ts
const generation = await llamagen.comic.create({
  prompt: 'The Little Prince meets the Fox in a luminous desert.',
  style: 'storybook manga',
  size: '1024x1024',
  pagination: {
    totalPages: 2,
    panelsPerPage: 4
  },
  comicRoles: [
    {
      name: 'The Little Prince',
      image: 'https://example.com/prince.png',
      clothing: 'green coat and yellow scarf'
    }
  ],
  comicLocations: [
    {
      name: 'Dreamwood Forest',
      image: 'https://example.com/forest.png'
    }
  ],
  attachments: [
    {
      type: 'image',
      url: 'https://example.com/reference.png'
    }
  ],
  language: 'en',
  upscale: '2K'
});
```

Comic methods:

- `llamagen.comic.create(params)` calls `POST /v1/comics/generations`.
- `llamagen.comic.get(id, { page, panel })` calls `GET /v1/comics/generations/{id}` and can request a specific zero-based page/panel.
- `llamagen.comic.continueWrite(id, params)` extends an existing comic with `action: "continueWrite"`.
- `llamagen.comic.updatePanel(id, params)` regenerates one panel with `action: "regeneratePanel"`.
- `llamagen.comic.usage()` calls `GET /v1/comics/usage`.
- `llamagen.comic.upload(file, filename?)` calls `POST /v1/comics/upload` for reference assets.
- `llamagen.comic.waitForCompletion(id, options?)` polls until a terminal status.
- `llamagen.comic.createAndWait(params, options?)` creates and polls.
- `llamagen.comic.createBatch(paramsList, options?)` submits many comic jobs with bounded concurrency.
- `llamagen.comic.waitForMany(ids, options?)` polls many comic jobs with bounded concurrency.

Backward-compatible aliases remain available: `createComic`, `getComic`, `continueComic`, `regeneratePanel`, and `updateComicPanel`.

## Animation API

Use `llamagen.animation` for text-to-video, image-to-video, storyboard-to-video, and reference-driven video artwork workflows. It targets the public Animation API route `POST /v1/artworks/generations`.

```ts
const video = await llamagen.animation.create({
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

const finished = await llamagen.animation.waitForCompletion(video.id, {
  intervalMs: 5000,
  timeoutMs: 300000
});
```

Animation methods:

- `llamagen.animation.create(params)` calls `POST /v1/artworks/generations`.
- `llamagen.animation.get(id)` calls `GET /v1/artworks/generations/{id}`.
- `llamagen.animation.waitForCompletion(id, options?)` polls video artwork status.
- `llamagen.animation.createAndWait(params, options?)` creates and polls.

`llamagen.animations` is an alias for `llamagen.animation`.

## Webhooks

Subscribe to comic generation lifecycle events in LlamaGen dashboard settings: `comic.generation.created`, `comic.generation.updated`, `comic.generation.completed`, and `comic.generation.failed`.

```ts
import { constructWebhookEvent } from 'comic';

export async function POST(request: Request) {
  const payload = await request.text();
  const event = constructWebhookEvent(
    payload,
    request.headers,
    process.env.LLAMAGEN_WEBHOOK_SECRET!
  );

  if (event.type === 'comic.generation.completed') {
    console.log(event.data);
  }

  return new Response('ok');
}
```

The helper verifies `X-Llama-Webhook-Timestamp` and `X-Llama-Webhook-Signature` with HMAC SHA-256 and a default 5-minute tolerance.

## Types

Common exported types:

- `CreateComicParams`, `ContinueComicParams`, `UpdateComicPanelParams`
- `ComicArtworkResponse`, `ComicPanel`, `ComicEntity`, `ComicUsage`
- `CreateAnimationParams`, `AnimationVideoOptions`, `AnimationArtworkResponse`
- `WaitForCompletionOptions`, `BatchCreateOptions`, `WaitManyOptions`
- `WebhookEvent`, `WebhookEventType`, `WebhookVerificationOptions`

Runtime constant:

- `SUPPORTED_COMIC_SIZES`

## HTTP API

Base URL: `https://api.llamagen.ai/v1`

Comic endpoints:

- `POST /comics/generations`
- `GET /comics/generations/{generationId}`
- `PATCH /comics/generations/{generationId}`
- `GET /comics/usage`
- `POST /comics/upload`

Animation endpoints:

- `POST /artworks/generations`
- `GET /artworks/generations/{id}`

Direct fetch example:

```ts
const response = await fetch('https://api.llamagen.ai/v1/comics/generations', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.LLAMAGEN_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A superhero cat saving a city from giant mice.',
    style: 'american comic',
    fixPanelNum: 4
  })
});

console.log(await response.json());
```

## MCP Integration

Endpoint:

```text
https://llamagen.ai/api/mcp
```

Auth header:

```http
Authorization: Bearer YOUR_API_KEY
```

Available MCP tools:

- `create_comic_generation`
- `get_comic_generation_status`
- `get_api_usage`

Generic MCP client config:

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

## Errors

- `LlamaGenAPIError`: non-2xx API response with `status` and `data`.
- `LlamaGenTimeoutError`: request timeout or polling timeout.
- `LlamaGenWebhookSignatureError`: invalid webhook timestamp or signature.

## Local Dev

```bash
npm install
npm run lint
npm test
npm run build
```

Smoke test with latest published SDK:

```bash
npm run smoke:latest
```

Project references:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)
- [docs/API.md](./docs/API.md)
- [docs/PROMPT_BASICS.md](./docs/PROMPT_BASICS.md)
- [docs/ROADMAP.md](./docs/ROADMAP.md)

# comic

[![CI](https://github.com/LlamaGenAI/comic/actions/workflows/ci.yml/badge.svg)](https://github.com/LlamaGenAI/comic/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/comic.svg)](https://www.npmjs.com/package/comic)
[![npm downloads](https://img.shields.io/npm/dm/comic.svg)](https://www.npmjs.com/package/comic)

Official JavaScript/TypeScript SDK for the LlamaGen Comic API.

Homepage: [http://llamagen.ai/comic-api](http://llamagen.ai/comic-api)

## Why `comic`

- Clean SDK for creators, agents, and product teams
- Typed request/response models for TypeScript
- Built-in polling, retries, batch concurrency, and timeout controls
- Works with SDK, HTTP, and cURL workflows

## Install

```bash
npm install comic
```

## Get `YOUR_API_KEY`

1. Open [LlamaGen Comic API Dashboard](http://llamagen.ai/comic-api)
2. Sign in and create an API key
3. Use the key in SDK or HTTP Authorization header

```http
Authorization: Bearer YOUR_API_KEY
```

## Quick Start (SDK)

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({
  apiKey: 'YOUR_API_KEY'
});

const created = await llamagen.comic.create({
  prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A sci-fi story about two friends on Mars'
});

const result = await llamagen.comic.waitForCompletion(created.id);
console.log(result.status, result.output);
```

## API Surface

### Client

- `new LlamaGenClient(options)`
- `options.apiKey: string` (required)
- `options.baseURL?: string` (default `https://api.llamagen.ai/v1`)
- `options.timeoutMs?: number` (default `30000`)
- `options.maxRetries?: number` (default `2`)
- `options.retryDelayMs?: number` (default `500`)
- `options.fetch?: typeof fetch`

### Namespace

All capabilities start from `llamagen.comic`:

- `llamagen.comic.create(params)`
- `llamagen.comic.get(id)`
- `llamagen.comic.waitForCompletion(id, options?)`
- `llamagen.comic.createAndWait(params, options?)`
- `llamagen.comic.createBatch(paramsList, options?)`
- `llamagen.comic.waitForMany(ids, options?)`

Backward compatibility aliases:

- `llamagen.comic.createComic(...)`
- `llamagen.comic.getComic(...)`

## TypeScript Types

Request/response types are maintained in:

- [`src/api-types.ts`](./src/api-types.ts)
- [`src/types.ts`](./src/types.ts)

Common types:

- `CreateComicParams`
- `ComicGenerationResponse`
- `ComicDetailResponse`
- `WaitForCompletionOptions`
- `BatchCreateOptions`
- `WaitForManyOptions`

## SDK Examples

### Create + Poll

```ts
const created = await llamagen.comic.create({
  prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A superhero cat saving a city from giant mice',
  preset: 'neutral',
  size: '1024x1024'
});

const done = await llamagen.comic.waitForCompletion(created.id, {
  intervalMs: 5000,
  timeoutMs: 180000
});
```

### Batch Workflow for Agents

```ts
const jobs = await llamagen.comic.createBatch(
  [
    { prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, Scene 1: hero enters the city' },
    { prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, Scene 2: conflict escalates' },
    { prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, Scene 3: final showdown' }
  ],
  { concurrency: 2, stopOnError: false }
);

const ids = jobs
  .filter((job) => job.result?.id)
  .map((job) => job.result.id);

const results = await llamagen.comic.waitForMany(ids, {
  concurrency: 3,
  intervalMs: 4000,
  timeoutMs: 240000
});
```

## HTTP API (Direct)

Base URL: `https://api.llamagen.ai/v1`

### 1) Create Generation

Endpoint: `POST /comics/generations`

Request body:

```json
{
  "prompt": "american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A superhero cat saving a city from giant mice",
  "preset": "neutral",
  "size": "1024x1024",
  "model": "optional-model-id"
}
```

cURL:

```bash
curl -X POST "https://api.llamagen.ai/v1/comics/generations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A superhero cat saving a city from giant mice",
    "preset": "neutral",
    "size": "1024x1024"
  }'
```

Example response:

```json
{
  "id": "gen_123456789",
  "status": "PENDING",
  "createdAt": "2026-03-05T00:00:00.000Z"
}
```

### 2) Get Generation

Endpoint: `GET /comics/generations/:id`

cURL:

```bash
curl -X GET "https://api.llamagen.ai/v1/comics/generations/YOUR_GENERATION_ID" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Example response:

```json
{
  "id": "gen_123456789",
  "status": "SUCCEEDED",
  "output": "https://cdn.llamagen.ai/comics/gen_123456789.webp",
  "createdAt": "2026-03-05T00:00:00.000Z",
  "comics": []
}
```

Error response example:

```json
{
  "error": "Unauthorized",
  "message": "Invalid API token"
}
```

## JavaScript Fetch Example

```ts
const response = await fetch('https://api.llamagen.ai/v1/comics/generations', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A superhero cat saving a city from giant mice',
    preset: 'neutral',
    size: '1024x1024'
  })
});

const data = await response.json();
console.log(data);
```

## Errors

- `LlamaGenAPIError`: non-2xx API response with `status` and `data`
- `LlamaGenTimeoutError`: request timeout or polling timeout

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

Outputs are written to `.local-smoke/results/<timestamp>/` and are not tracked by git.

## 90-Day Growth Plan

- Month 1: tighten docs, examples, and onboarding friction (time-to-first-image < 5 minutes)
- Month 2: deepen framework integrations and production patterns for AI agents
- Month 3: scale community contributions, issue velocity, and benchmark showcases

Project references:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)
- [CLAUDE.md](./CLAUDE.md)
- [docs/ROADMAP.md](./docs/ROADMAP.md)

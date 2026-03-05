# comic

[![CI](https://github.com/LlamaGenAI/comic/actions/workflows/ci.yml/badge.svg)](https://github.com/LlamaGenAI/comic/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/comic.svg)](https://www.npmjs.com/package/comic)
[![npm downloads](https://img.shields.io/npm/dm/comic.svg)](https://www.npmjs.com/package/comic)

Official JavaScript/TypeScript SDK for LlamaGen comic APIs.

## Install

```bash
npm install comic
```

## How To Get `YOUR_API_KEY`

1. Open [LlamaGen Comic API Dashboard](http://llamagen.ai/comic-api).
2. Sign in and create/view an API token in the dashboard.
3. Use that token as `YOUR_API_KEY` in this SDK.

Authentication uses Bearer token:

```http
Authorization: Bearer YOUR_API_KEY
```

## Quick Start

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({
  apiKey: 'YOUR_API_KEY'
});

const created = await llamagen.comic.create({
  prompt: 'A sci-fi story about two friends on Mars'
});

const artwork = await llamagen.comic.waitForCompletion(created.id);
console.log(artwork.status);
```

## Direct HTTP / cURL (No SDK)

Base URL: `https://api.llamagen.ai/v1`

Create generation with `curl`:

```bash
curl -X POST https://api.llamagen.ai/v1/comics/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A superhero cat saving a city from giant mice",
    "preset": "render",
    "size": "1024x1024"
  }'
```

Get generation result with `curl`:

```bash
curl -X GET https://api.llamagen.ai/v1/comics/generations/YOUR_GENERATION_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Create generation with native `fetch`:

```ts
const response = await fetch('https://api.llamagen.ai/v1/comics/generations', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.LLAMAGEN_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A superhero cat saving a city from giant mice',
    preset: 'render',
    size: '1024x1024'
  })
});

const created = await response.json();
```

## API

### `new LlamaGenClient(options)`

- `apiKey: string` (required)
- `baseURL?: string` (default: `https://api.llamagen.ai/v1`)
- `timeoutMs?: number` (default: `30000`)
- `maxRetries?: number` (default: `2`, retries on `429` and `5xx`)
- `retryDelayMs?: number` (default: `500`)
- `fetch?: typeof fetch` (optional custom fetch)

### `llamagen.comic.create(params)`

Creates a comic generation task.

- `prompt: string` (required)
- `size?: string` (default: `1024x1024`)
- `preset?: string` (default: `render`)
- `model?: string` (optional, API chooses model when omitted)
- Any extra fields are forwarded to API.

### `llamagen.comic.get(artworkId)`

Fetches a comic generation by ID.

Input validation:

- `prompt` must be a non-empty string for `create(...)`
- `artworkId` must be a non-empty string for `get(...)`

### `llamagen.comic.waitForCompletion(artworkId, options?)`

Polls until generation reaches a terminal status.

- `intervalMs?: number` (default `5000`)
- `timeoutMs?: number` (default `180000`)
- `doneStatuses?: string[]` (default `['SUCCEEDED','FAILED','PROCESSED','COMPLETED']`)

### `llamagen.comic.createAndWait(params, options?)`

Creates then waits for completion.

### Backward-compatible aliases

- `llamagen.comic.createComic(...)`
- `llamagen.comic.getComic(...)`

## Errors

- `LlamaGenAPIError` for non-2xx API responses (`status`, `data` included)
- `LlamaGenTimeoutError` for timeout or polling timeout

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

For contribution workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).
For long-term direction, see [docs/ROADMAP.md](./docs/ROADMAP.md).

## Git & Release Workflow

Update `origin` quickly:

```bash
npm run remote:set -- git@github.com:LlamaGenAI/comic.git
```

Semantic version release (auto lint/test/build + version bump + git tag + push):

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

Direct publish with auto `minor` bump:

```bash
npm run publish:minor
# if your npm account requires OTP:
NPM_OTP=123456 npm run publish:minor
```

## Next.js Demo

A direct SDK integration demo for Next.js is available in:

- [`examples/nextjs-integration`](./examples/nextjs-integration)

## Express Demo

A direct SDK integration demo for Express is available in:

- [`examples/express-integration`](./examples/express-integration)

See detailed plan in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).

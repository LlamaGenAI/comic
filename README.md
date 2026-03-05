# comic

Official JavaScript/TypeScript SDK for LlamaGen comic APIs.

## Install

```bash
npm install comic
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

## API

### `new LlamaGenClient(options)`

- `apiKey: string` (required)
- `baseURL?: string` (default: `https://api.llamagen.ai/v1`)
- `timeoutMs?: number` (default: `30000`)
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

A full-stack integration demo with API routes and tests is available in:

- [`examples/nextjs-integration`](./examples/nextjs-integration)

See detailed plan in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).

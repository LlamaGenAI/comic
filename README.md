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

const created = await llamagen.comics.create({
  prompt: 'A sci-fi story about two friends on Mars'
});

const artwork = await llamagen.comics.waitForCompletion(created.id);
console.log(artwork.status);
```

## API

### `new LlamaGenClient(options)`

- `apiKey: string` (required)
- `baseURL?: string` (default: `https://llamagen.ai/api/v1`)
- `timeoutMs?: number` (default: `30000`)
- `fetch?: typeof fetch` (optional custom fetch)

### `llamagen.comics.create(params)`

Creates a comic generation task.

- `prompt: string` (required)
- `size?: string` (default: `1024x1024`)
- `model?: string` (default: `cyani-model`)
- Any extra fields are forwarded to API.

### `llamagen.comics.get(artworkId)`

Fetches a comic generation by ID.

### `llamagen.comics.waitForCompletion(artworkId, options?)`

Polls until generation reaches a done status.

- `intervalMs?: number` (default `5000`)
- `timeoutMs?: number` (default `180000`)
- `doneStatuses?: string[]` (default `['PROCESSED','SUCCEEDED','COMPLETED']`)

### `llamagen.comics.createAndWait(params, options?)`

Creates then waits for completion.

### Backward-compatible aliases

- `llamagen.comics.createComic(...)`
- `llamagen.comics.getComic(...)`

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

See detailed plan in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).

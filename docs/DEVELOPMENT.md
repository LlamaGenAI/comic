# Development Guide

## Goals

- Public package name: `comic`
- Client entrypoint:

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({ apiKey: 'YOUR_API_KEY' });
```

- Root namespace starts with `llamagen.*` and all demo SDK capabilities are covered.
- API spec aligned with comic docs page:
  - Base URL: `https://api.llamagen.ai/v1`
  - Create params include `prompt`, optional `preset` (default `render`), optional `size`, optional `model`
  - Generation statuses include `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`

## Covered Capabilities

This package includes all capabilities present in `webtoon-sdk-demo/packages/sdk`:

- Create comic generation (`POST /comics/generations`)
- Get comic generation by ID (`GET /comics/generations/:id`)

Additional developer-focused helper:

- Wait/poll until completion (`waitForCompletion`)
- One-shot create+wait (`createAndWait`)

## Next.js Full-stack Demo

Added under `examples/nextjs-integration`:

- Server SDK client factory (`lib/client.ts`)
- Service layer (`lib/comics-service.ts`)
- API routes (`app/api/comics`, `app/api/comics/[id]`)
- Server page integration helper (`app/page.ts`)
- Dedicated tests in `tests/nextjs-integration.spec.ts`

## Test Strategy

Unit tests use mocked fetch to avoid external dependency and verify:

- Auth headers
- Request paths and payload defaults
- Success and failure behavior
- Timeout and polling behavior
- Backward-compatible alias methods

## Release Checklist

1. `npm install`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npm pack` (local artifact check)
6. `npm publish --access public`

## GitHub Launch Checklist

1. Push repository to GitHub
2. Add package README badges and examples
3. Enable Issues + Discussions
4. Add CI for lint/test/build on pull requests
5. Add semantic version tags and release notes

## Brand / Copyright

Package metadata and license currently set to `llamagne.ai` per requirement.

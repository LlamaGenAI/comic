# CLAUDE.md

## Project Summary

`comic` is the official JavaScript/TypeScript SDK for LlamaGen Comic APIs.

Primary value:

- Typed SDK for comic generation APIs
- Direct integrations for modern full-stack frameworks
- SDK-first usage with optional raw HTTP/cURL examples

## Core API Surface

Main entrypoint:

```ts
import { LlamaGenClient } from 'comic';
```

Core namespace:

- `llamagen.comic.create(params)`
- `llamagen.comic.get(id)`
- `llamagen.comic.waitForCompletion(id, options)`
- `llamagen.comic.createAndWait(params, options)`

Backward compatibility:

- `llamagen.comics` is kept as an alias of `llamagen.comic`.

## Type System

SDK and API payload types are maintained in:

- `src/api-types.ts` (request/response/status contracts)
- `src/types.ts` (client options + type re-exports)

## Reliability Features

- Built-in timeout control
- Automatic retries for `429` and `5xx` responses
- Input validation for key fields (`prompt`, `artworkId`)
- Structured API errors with status/data

## Integrations

- Next.js direct SDK example: `examples/nextjs-integration`
- Express direct SDK example: `examples/express-integration`

## Quality & Release Workflow

- CI: lint + test + build on push/PR
- Tests: unit and integration-style service tests
- Release command: `npm run publish:minor`
- Automated semantic version bump + npm publish + git tag push

## Documentation

Primary docs:

- `README.md`
- `docs/API.md`
- `docs/DEVELOPMENT.md`
- `docs/ROADMAP.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

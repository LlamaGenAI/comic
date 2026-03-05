# Next.js Integration Demo

This folder demonstrates a full-stack Next.js integration using the `comic` SDK.

## What is included

- Server client wiring from environment variables
- API routes:
  - `POST /api/comics` to create generation
  - `GET /api/comics/[id]` to query generation
- Server helper for app router page integration (`app/page.ts`)
- Dedicated tests for service and route handlers

## Env

Set one of the following in your Next.js app:

- `LLAMAGEN_API_KEY` (recommended)
- `WEBTOON_API_KEY` (backward compatible)

## Route usage

Create generation:

```bash
curl -X POST http://localhost:3000/api/comics \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"A fox detective in Tokyo","preset":"render","size":"1024x1024"}'
```

Get generation:

```bash
curl http://localhost:3000/api/comics/gen_123
```

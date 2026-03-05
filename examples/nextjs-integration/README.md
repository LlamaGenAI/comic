# Next.js Integration Demo (Direct SDK)

This demo shows the recommended integration for Next.js: install `comic` and call the SDK directly in server-side code.

## Install

```bash
npm i comic
```

## Environment

Set:

- `LLAMAGEN_API_KEY`

## Recommended usage in Next.js (Server Component / Server Action)

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({ apiKey: process.env.LLAMAGEN_API_KEY! });

const created = await llamagen.comic.create({
  prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors,A fox detective in New York City',
  preset: 'neutral',
  size: '1024x1024'
});

const result = await llamagen.comic.waitForCompletion(created.id);
```

## Demo files

- `lib/client.ts`: client factory from env
- `lib/comic-sdk.ts`: direct SDK service wrapper
- `app/page.ts`: server-side demo helper usage

This demo intentionally avoids extra `/api/*` proxy routes so users can integrate faster with fewer layers.

## Alternative: direct HTTP/cURL

If you do not want to use SDK, call the same endpoints directly:

```bash
curl -X POST https://api.llamagen.ai/v1/comics/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A fox detective in Tokyo","preset":"neutral","size":"1024x1024"}'
```

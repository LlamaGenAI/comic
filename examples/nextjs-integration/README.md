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
  prompt: 'A fox detective in Tokyo',
  preset: 'render',
  size: '1024x1024'
});

const result = await llamagen.comic.waitForCompletion(created.id);
```

## Demo files

- `lib/client.ts`: client factory from env
- `lib/comic-sdk.ts`: direct SDK service wrapper
- `app/page.ts`: server-side demo helper usage

This demo intentionally avoids extra `/api/*` proxy routes so users can integrate faster with fewer layers.

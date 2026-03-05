# AI Agent Integration Demo

This guide shows how an agent can orchestrate multiple comic generation tasks.

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({ apiKey: 'YOUR_API_KEY' });

const jobs = await llamagen.comic.createBatch(
  [
    { prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, chapter 1 opening' },
    { prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, chapter 1 conflict' },
    { prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, chapter 1 ending' }
  ],
  { concurrency: 2, stopOnError: false }
);

const ids = jobs.flatMap((j) => (j.result?.id ? [j.result.id] : []));
const completed = await llamagen.comic.waitForMany(ids, {
  concurrency: 3,
  intervalMs: 4000,
  timeoutMs: 240000
});

console.log(completed.map((x) => ({ id: x.id, status: x.status })));
```

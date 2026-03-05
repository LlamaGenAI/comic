# API Reference

## Client

```ts
import { LlamaGenClient } from 'comic';

const llamagen = new LlamaGenClient({ apiKey: 'YOUR_API_KEY' });
```

## `llamagen.comics.create(params)`

Creates a comic generation task.

```ts
const created = await llamagen.comics.create({
  prompt: 'An epic battle in a cyberpunk city',
  preset: 'render',
  size: '1024x1024'
});
```

## `llamagen.comics.get(artworkId)`

Gets generation detail by id.

```ts
const artwork = await llamagen.comics.get('cm23iyz3r0001le03m39ykh8v');
```

## `llamagen.comics.waitForCompletion(artworkId, options?)`

Polls until one of done statuses is reached.

```ts
const done = await llamagen.comics.waitForCompletion('cm23iyz3r0001le03m39ykh8v', {
  intervalMs: 5000,
  timeoutMs: 180000
});
```

Default terminal statuses: `SUCCEEDED`, `FAILED`, `PROCESSED`, `COMPLETED`.

## `llamagen.comics.createAndWait(params, options?)`

One-shot create and poll.

```ts
const done = await llamagen.comics.createAndWait({
  prompt: 'A detective story in Tokyo'
});
```

## Backward-compatible aliases

```ts
await llamagen.comics.createComic({ prompt: 'legacy path' });
await llamagen.comics.getComic('cm123');
```

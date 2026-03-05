# Express Integration Demo (Direct SDK)

This demo shows how to use `comic` directly in an Express server.

## Install

```bash
npm i comic express
```

## Environment

- `LLAMAGEN_API_KEY`

## Example server

See `server.js` for a runnable example.

It exposes:

- `POST /comic/create` -> `llamagen.comic.create(...)`
- `GET /comic/:id` -> `llamagen.comic.get(...)`

## SDK-first recommendation

Use SDK directly in your route handlers instead of building another proxy layer.

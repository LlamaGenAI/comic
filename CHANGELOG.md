# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- Comic API helpers for continue-write, panel regeneration, usage lookup, and reference uploads.
- Animation API namespace for `/v1/artworks/generations` text-to-video and image-to-video workflows.
- Webhook signature verification helpers for `X-Llama-Webhook-*` headers.
- Typed request/response models for pagination, roles, locations, attachments, usage, uploads, animation video options, and webhooks.
- Direct HTTP (`fetch`) and `curl` examples in docs.
- Express direct SDK integration demo under `examples/express-integration`.
- GitHub CI workflow and community templates.
- Contribution and roadmap documents.

### Changed

- README and API reference now document the latest Comic API and Animation API surface.
- Next.js demo simplified to SDK-first integration (removed extra API proxy routes).
- Standardized docs around `LLAMAGEN_API_KEY` and removed legacy references.

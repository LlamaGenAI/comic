# Contributing

## Development setup

```bash
npm install
npm run lint
npm test
npm run build
```

## Branch and PR rules

- Keep changes focused and small.
- Add tests for behavior changes.
- Update docs when API surface changes.
- Ensure CI passes before merge.

## Release

Maintainers publish with:

```bash
npm run publish:minor
```

For patch/major tags without publish:

```bash
npm run release:patch
npm run release:major
```

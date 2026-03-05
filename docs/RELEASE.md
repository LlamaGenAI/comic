# Release Guide

## Preflight

```bash
npm install
npm run lint
npm test
npm run build
npm pack --cache ./.npm-cache
```

## Publish to npm

If account has write 2FA:

```bash
npm publish --access public --otp=123456
```

If using granular token with bypass 2FA for writes:

```bash
npm publish --access public
```

## Publish to GitHub

```bash
git add .
git commit -m "feat: release comic v2.0.0 sdk"
git push origin <branch>
```

Then create GitHub release/tag: `v2.0.0`.

## One-Year Growth Plan (Execution)

1. Add CI badges and typed examples in README.
2. Keep weekly release cadence with changelogs.
3. Publish starter templates for Node/Next.js.
4. Add benchmark and reliability reports.
5. Run public roadmap and issue triage every week.

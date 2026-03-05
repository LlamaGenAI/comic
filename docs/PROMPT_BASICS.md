# Prompt Basics Tutorial

This guide helps you write better comic prompts with three core blocks:

- visual style
- story plot
- character description

You can use one long sentence, or compose a structured prompt from fields and then send it to `llamagen.comic.create(...)`.

## 1) Basic Structure

Use this order for stable outputs:

1. Visual style
2. Story / scene goal
3. Character details
4. Composition / camera / mood
5. Quality constraints

Template:

```txt
[Visual style], [Story plot], [Character description], [Composition and mood], [Quality constraints]
```

Example:

```txt
American comic illustration, bold ink lines and high-contrast colors, a rookie detective finds a hidden lab in rainy midnight Tokyo, main character: young female detective with short black hair and yellow raincoat, medium shot with cinematic rim light and tense atmosphere, clean anatomy, readable face, no text watermark
```

## 2) Prompt Writing Tips

- Keep each block short but specific.
- Put high-priority constraints early.
- Keep character identity consistent across panels (same hair/clothes/color keywords).
- Avoid conflicting styles in one prompt (for example: "minimal flat icon" and "hyper realistic oil painting").
- If the result drifts, reduce abstraction and add concrete nouns (location, props, actions, lighting).

## 3) Reusable Prompt Script

Use a small helper to build prompts from structured inputs:

```ts
type PromptInput = {
  visualStyle: string;
  plot: string;
  characters: string;
  composition?: string;
  constraints?: string;
};

export function buildComicPrompt(input: PromptInput): string {
  return [
    input.visualStyle,
    input.plot,
    input.characters,
    input.composition ?? 'cinematic composition, clear focal point',
    input.constraints ?? 'clean line art, coherent anatomy, no watermark'
  ]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(', ');
}
```

Usage:

```ts
import { LlamaGenClient } from 'comic';
import { buildComicPrompt } from './prompt-builder';

const client = new LlamaGenClient({ apiKey: process.env.LLAMAGEN_API_KEY! });

const prompt = buildComicPrompt({
  visualStyle: 'American comic illustration, bold outlines, vibrant high-contrast palette',
  plot: 'A resistance team escapes from a collapsing skybridge at sunset',
  characters: 'leader: tall woman with silver jacket; hacker: teenage boy with red visor',
  composition: 'wide shot, dynamic perspective, motion blur on debris',
  constraints: 'consistent character costume, sharp details, no text watermark'
});

const created = await client.comic.create({
  prompt,
  preset: 'neutral',
  size: '1024x1024'
});
```

## 4) Multi-panel Story Pattern

For multi-panel generation, keep visual style and character block fixed, only change panel action:

```ts
const style = 'American comic illustration, heavy ink lines, dramatic lighting';
const cast = 'hero: black trench coat and blue scarf; partner: orange bomber jacket';

const panelPrompts = [
  `${style}, ${cast}, panel 1: they enter the abandoned station, wide establishing shot`,
  `${style}, ${cast}, panel 2: they discover a glowing core room, medium shot with suspense`,
  `${style}, ${cast}, panel 3: explosion behind them while they jump to safety, dynamic action shot`
];
```

Then use `createBatch(...)` + `waitForMany(...)` from [API Reference](./API.md).

## 5) Troubleshooting

- Problem: style is inconsistent
  - Fix: lock one style phrase and reuse it exactly in every panel prompt
- Problem: character looks different each frame
  - Fix: repeat identity tokens (hair, outfit, age, accessories, color)
- Problem: scene is too vague
  - Fix: add location + time + action verb + camera distance
- Problem: cluttered output
  - Fix: remove extra adjectives and keep one main action per panel

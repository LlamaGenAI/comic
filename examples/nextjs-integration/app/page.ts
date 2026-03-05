import { createServerLlamaGenClient } from '../lib/client';

// Server-side helper for Next.js app router usage.
// In a real page.tsx, call this helper and render the returned data.
export async function getDemoComicGeneration() {
  const llamagen = createServerLlamaGenClient();
  return llamagen.comics.create({
    prompt: 'A short four-panel comic about a robot learning to cook.',
    preset: 'render',
    size: '1024x1024'
  });
}

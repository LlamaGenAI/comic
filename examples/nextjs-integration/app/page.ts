import { createDefaultComicSDKService } from '../lib/comic-sdk';

// Server-side helper for Next.js app router usage.
// In a real page.tsx, call this helper and render the returned data.
export async function getDemoComicGeneration() {
  const comic = createDefaultComicSDKService();
  return comic.createGeneration({
    prompt: 'A short four-panel comic about a robot learning to cook.',
    preset: 'render',
    size: '1024x1024'
  });
}

export async function getDemoComicGenerationWithPolling() {
  const comic = createDefaultComicSDKService();
  return comic.createAndWait({
    prompt: 'A short four-panel comic about a robot learning to cook.',
    preset: 'render',
    size: '1024x1024'
  });
}

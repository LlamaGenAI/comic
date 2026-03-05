import { createDefaultComicSDKService } from '../lib/comic-sdk';

// Server-side helper for Next.js app router usage.
// In a real page.tsx, call this helper and render the returned data.
export async function getDemoComicGeneration() {
  const comic = createDefaultComicSDKService();
  return comic.createGeneration({
    prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A short four-panel comic about a robot learning to cook.',
    preset: 'neutral',
    size: '1024x1024'
  });
}

export async function getDemoComicGenerationWithPolling() {
  const comic = createDefaultComicSDKService();
  return comic.createAndWait({
    prompt: 'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A short four-panel comic about a robot learning to cook.',
    preset: 'neutral',
    size: '1024x1024'
  });
}

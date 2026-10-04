import type { ChecklistItem } from '../db/types';

/**
 * The "make it look premium" check before a post is marked Ready. Drawn from
 * designers' answers in r/graphic_design ("What are your go-to techniques for
 * making designs look premium?"): fundamentals first — concept, hierarchy, type,
 * spacing, white space, contrast — then edit down. Plus the 2026 platform
 * basics that decide whether anyone sees it.
 */
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'concept', label: 'One clear idea or story', hint: 'A real concept presented well beats any effect. Can you say the point in one sentence?', on: true },
  { id: 'hierarchy', label: 'Obvious hierarchy', hint: 'One focal point. In one second, what do you read first, second, third?', on: true },
  { id: 'type', label: 'Type pairing and kerning checked', hint: 'Two typefaces at most, a clear size ratio, headlines kerned by eye.', on: true },
  { id: 'grid', label: 'Aligned to a grid, even spacing', hint: 'Margins match; nothing is almost-aligned.', on: true },
  { id: 'space', label: 'White space left to breathe', hint: 'White space is the lungs of the layout. Crowded reads cheap.', on: true },
  { id: 'contrast', label: 'Strong contrast, readable on a phone', hint: 'Check it at phone size and in dark mode. Text never sits on a busy photo without a backing.', on: true },
  { id: 'palette', label: 'Tight colour palette', hint: 'Brand colours plus one accent. More colours means less clarity.', on: true },
  { id: 'remove2', label: 'Removed two things before finishing', hint: 'Like accessorising an outfit: take two things off at the end. It always gets crisper.', on: true },
  { id: 'texture', label: 'Effects only where they earn it', hint: 'Grain or texture can add warmth; gradients, bevels and shadows rarely do. No effect is free.', on: true },
  { id: 'hook', label: 'Hook in the first frame or slide', hint: 'Carousels: slide 1 and slide 2 both work as hooks (Instagram re-shows slide 2). Reels: the first 3 seconds say why to stay.', on: true },
  { id: 'cta', label: 'One clear call to action', hint: 'A single ask: save, share, comment a keyword, or DM. Last slide or end of the reel.', on: true },
  { id: 'size', label: 'Right size and safe zones', hint: 'Feed: 4:5 (1080×1350). Reels/TikTok/Stories: 9:16 (1080×1920), keep text out of the bottom 20% and the right edge.', on: true },
  { id: 'original', label: 'Original, made by us', hint: 'Facebook and Instagram push down reposts and lightly edited clips. Show the process, our faces and voices.', on: true },
  { id: 'brand', label: 'On brand', hint: 'Logo placement, colours and voice match the JoshWorks kit (or the client’s).', on: true },
  { id: 'proof', label: 'Proofread, names and prices checked', hint: 'Read it out loud. Client names, prices, dates and handles are right.', on: true },
  { id: 'alt', label: 'Alt text and captions on video', hint: 'Describe the image; burn in or add captions — most people watch muted.', on: true },
];

export function checklistScore(items: ChecklistItem[], done: Record<string, boolean>): { done: number; total: number } {
  const active = items.filter((i) => i.on);
  return { done: active.filter((i) => done[i.id]).length, total: active.length };
}

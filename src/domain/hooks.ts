import { addDays } from '../lib/time';

/**
 * Hook patterns that work for a design studio, and the daily practice from
 * creator coaches: save every scroll-stopping reel and note why it worked,
 * then rewrite one viral hook in your own words every day for 30 days.
 */
export interface HookPattern {
  id: string;
  name: string;
  template: string;
  example: string;
}

export const HOOK_PATTERNS: HookPattern[] = [
  { id: 'mistakes', name: 'Mistakes', template: '[Number] [topic] mistakes [audience] make', example: '5 logo mistakes that make your brand look cheap' },
  { id: 'stop', name: 'Stop doing', template: 'Stop [common habit] if you want [result]', example: 'Stop adding gradients to your logo' },
  { id: 'nobody', name: 'Nobody tells you', template: 'Nobody tells you this about [topic]', example: 'Nobody tells you this about printing stickers' },
  { id: 'before-after', name: 'Before → after', template: 'From [before] to [after] in [time]', example: 'From napkin sketch to full brand in 14 days' },
  { id: 'pov', name: 'POV', template: 'POV: [relatable situation]', example: 'POV: the client wants the logo bigger' },
  { id: 'what-if', name: 'What if', template: 'What if [familiar thing] had [design twist]?', example: 'What if Dinagyang had an official mascot?' },
  { id: 'rate', name: 'Rate this', template: 'Rate this [thing] from 1 to 10', example: 'Rate this jeepney sign redesign, 1 to 10' },
  { id: 'difference', name: 'The difference', template: 'The difference between [A] and [B]', example: 'Logo vs brand vs branding (most people get this wrong)' },
  { id: 'how-i', name: 'How I', template: 'How I [result] for [client] in [time]', example: 'How I designed a mascot in 3 days' },
  { id: 'steal', name: 'Steal this', template: 'Steal this [template or trick] for your [thing]', example: 'Steal this font pairing for your café menu' },
  { id: 'opinion', name: 'Unpopular opinion', template: 'Unpopular opinion: [take]', example: 'Unpopular opinion: your logo doesn’t need an icon' },
  { id: 'never', name: 'I’d never', template: '[Number] [things] I’d never [do] as a designer', example: '3 fonts I’d never put on a shirt' },
  { id: 'story', name: 'Story', template: 'This client almost [problem]… then [twist]', example: 'This client almost printed 500 shirts with a typo' },
  { id: 'challenge', name: 'Challenge', template: 'Redraw this in your style', example: 'Redraw our mascot in your style — we’ll repost the best' },
  { id: 'local', name: 'Local twist', template: '[Local thing], but make it [style]', example: 'Ilonggo phrases, but make them shirt-ready' },
];

/** Practice streak from the days someone did their hook rewrite. */
export function streak(days: Iterable<string>, today: string): { current: number; best: number; last30: { date: string; done: boolean }[] } {
  const set = new Set(days);
  let current = 0;
  // Today not done yet still keeps yesterday's streak alive.
  let d = set.has(today) ? today : addDays(today, -1);
  while (set.has(d)) {
    current++;
    d = addDays(d, -1);
  }
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i - 29);
    return { date, done: set.has(date) };
  });
  return { current, best, last30 };
}

import Anthropic from '@anthropic-ai/sdk';
import { getLocal, setLocal } from '../db/local';

/**
 * Claude in the browser, with the owner's own API key. The key stays on this
 * device (it never syncs or leaves except to api.anthropic.com). Requests
 * stream, can search the web (for current trends), and fall back to another
 * model automatically if a request is declined.
 */

export interface ModelInfo {
  id: string;
  label: string;
  note: string;
  /** USD per million tokens. */
  input: number;
  output: number;
  cacheRead: number;
  /** Uses the newer web search with dynamic filtering. */
  dynamicSearch: boolean;
  /** Accepts output_config.effort. */
  effort: boolean;
  /** Supports server-side refusal fallbacks ("default"). */
  fallbacks: boolean;
}

export const MODELS: ModelInfo[] = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Best writing and research', input: 4, output: 20, cacheRead: 0.2, dynamicSearch: true, effort: true, fallbacks: true },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'Faster, about half the price', input: 2, output: 10, cacheRead: 0.2, dynamicSearch: true, effort: true, fallbacks: true },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', note: 'Cheapest, for quick captions', input: 1, output: 5, cacheRead: 0.1, dynamicSearch: false, effort: false, fallbacks: false },
];

/** Web search is billed per search on top of tokens ($10 per 1,000). */
export const SEARCH_USD = 0.01;

export const modelInfo = (id: string): ModelInfo => MODELS.find((m) => m.id === id) ?? MODELS[0];

const KEY = 'claudeApiKey';

export const getApiKey = () => getLocal<string>(KEY, '');
export const setApiKey = (key: string) => setLocal(KEY, key.trim());

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface StreamResult {
  text: string;
  sources: { title: string; url: string }[];
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number; searches: number; costUsd: number; model: string };
  stopReason: string | null;
}

export class AssistantError extends Error {}

function friendly(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'That API key isn’t valid. Check it in Settings → Assistant.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'This API key isn’t allowed to use that model. Pick another model in Settings → Assistant.';
  if (e instanceof Anthropic.RateLimitError) return 'Too many requests right now. Wait a minute and try again.';
  if (e instanceof Anthropic.APIConnectionError) return 'Can’t reach Claude. Check the internet connection.';
  if (e instanceof Anthropic.BadRequestError) return /credit|billing|balance/i.test(e.message) ? 'The Claude account is out of credit. Add credit in the Claude Console (Billing).' : `Claude couldn’t take that request: ${e.message}`;
  if (e instanceof Anthropic.APIError) return `Claude had a problem (${e.status ?? 'error'}). Try again in a moment.`;
  if (e instanceof Error && e.name === 'AbortError') return 'Stopped.';
  return e instanceof Error ? e.message : 'Something went wrong.';
}

/**
 * Send a conversation and stream the answer.
 * The system prompt is cached (it's the same brand context every time), so
 * follow-up questions cost a fraction of the first.
 */
export async function streamChat(opts: {
  system: string;
  turns: ChatTurn[];
  model: string;
  effort: 'low' | 'medium' | 'high';
  webSearch: boolean;
  maxSearches?: number;
  signal?: AbortSignal;
  onText: (delta: string) => void;
  onStatus?: (status: string) => void;
}): Promise<StreamResult> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new AssistantError('Add your Claude API key in Settings → Assistant first.');
  const info = modelInfo(opts.model);
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });

  const tools: Anthropic.Beta.BetaToolUnion[] = opts.webSearch
    ? [
        info.dynamicSearch
          ? { type: 'web_search_20260209', name: 'web_search', max_uses: opts.maxSearches ?? 5, user_location: { type: 'approximate', city: 'Iloilo City', region: 'Western Visayas', country: 'PH', timezone: 'Asia/Manila' } }
          : { type: 'web_search_20250305', name: 'web_search', max_uses: opts.maxSearches ?? 5, user_location: { type: 'approximate', city: 'Iloilo City', region: 'Western Visayas', country: 'PH', timezone: 'Asia/Manila' } },
      ]
    : [];

  let messages: Anthropic.Beta.BetaMessageParam[] = opts.turns.map((t) => ({ role: t.role, content: t.text }));
  let text = '';
  const sources = new Map<string, string>();
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, searches: 0, costUsd: 0, model: info.id };
  let stopReason: string | null = null;

  try {
    // A long web search can pause the turn; send it back to continue (never add a "Continue" message).
    for (let round = 0; round < 4; round++) {
      const stream = client.beta.messages.stream(
        {
          model: info.id,
          max_tokens: 64000,
          system: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }],
          messages,
          ...(tools.length ? { tools } : {}),
          ...(info.effort ? { output_config: { effort: opts.effort } } : {}),
          ...(info.fallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        },
        { signal: opts.signal },
      );
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          text += event.delta.text;
          opts.onText(event.delta.text);
        } else if (event.type === 'content_block_start' && event.content_block.type === 'server_tool_use') {
          opts.onStatus?.('Searching the web…');
        } else if (event.type === 'content_block_start' && event.content_block.type === 'text') {
          opts.onStatus?.('Writing…');
        }
      }
      const msg = await stream.finalMessage();
      stopReason = msg.stop_reason;
      const u = msg.usage;
      usage.input += u.input_tokens ?? 0;
      usage.output += u.output_tokens ?? 0;
      usage.cacheRead += u.cache_read_input_tokens ?? 0;
      usage.cacheWrite += u.cache_creation_input_tokens ?? 0;
      usage.searches += u.server_tool_use?.web_search_requests ?? 0;
      for (const block of msg.content) {
        if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
          for (const r of block.content) if (r.type === 'web_search_result' && !sources.has(r.url)) sources.set(r.url, r.title);
        }
        if (block.type === 'text' && block.citations) {
          for (const c of block.citations) if (c.type === 'web_search_result_location' && !sources.has(c.url)) sources.set(c.url, c.title ?? c.url);
        }
      }
      if (msg.stop_reason === 'pause_turn') {
        messages = [...messages, { role: 'assistant', content: msg.content as Anthropic.Beta.BetaContentBlockParam[] }];
        continue;
      }
      if (msg.stop_reason === 'refusal') {
        const note = '\n\n_Claude declined part of this request. Try rephrasing it._';
        text += note;
        opts.onText(note);
      }
      break;
    }
  } catch (e) {
    throw new AssistantError(friendly(e));
  }
  usage.costUsd = (usage.input * info.input + usage.output * info.output + usage.cacheRead * info.cacheRead + usage.cacheWrite * info.input * 1.25) / 1_000_000 + usage.searches * SEARCH_USD;
  return { text, sources: [...sources.entries()].map(([url, title]) => ({ url, title })), usage, stopReason };
}

/** A quick check that the key works (a tiny request). */
export async function testKey(key: string, model: string): Promise<string | null> {
  try {
    const client = new Anthropic({ apiKey: key.trim(), dangerouslyAllowBrowser: true, maxRetries: 0 });
    const info = modelInfo(model);
    await client.messages.create({ model: info.id, max_tokens: 16, messages: [{ role: 'user', content: 'Reply with OK.' }], ...(info.effort ? { output_config: { effort: 'low' as const } } : {}) });
    return null;
  } catch (e) {
    return friendly(e);
  }
}

import type { ProviderAdapter, ProviderResult } from './types';

export const openrouterAdapter: ProviderAdapter = {
  id: 'openrouter',
  label: 'OpenRouter',
  supportsText: true,
  supportsImages: false,
  async test(apiKey: string): Promise<ProviderResult> {
    const t0 = Date.now();
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - t0;
      if (!res.ok) return { ok: false, provider: 'openrouter', error: `HTTP ${res.status}`, latencyMs };
      const json = (await res.json()) as { data: unknown[] };
      return { ok: true, provider: 'openrouter', model: json.data[0] ? 'list-ok' : 'empty', latencyMs };
    } catch (e) {
      return { ok: false, provider: 'openrouter', error: String(e), latencyMs: Date.now() - t0 };
    }
  },
};

import type { ProviderAdapter, ProviderResult } from './types';

export const kiloAdapter: ProviderAdapter = {
  id: 'kilo',
  label: 'Kilo',
  supportsText: true,
  supportsImages: false,
  async test(apiKey: string): Promise<ProviderResult> {
    const t0 = Date.now();
    try {
      const res = await fetch('https://api.kilo.ai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - t0;
      if (!res.ok) return { ok: false, provider: 'kilo', error: `HTTP ${res.status}`, latencyMs };
      return { ok: true, provider: 'kilo', model: 'available', latencyMs };
    } catch (e) {
      return { ok: false, provider: 'kilo', error: String(e), latencyMs: Date.now() - t0 };
    }
  },
};

import type { ProviderAdapter, ProviderResult } from './types';

export const nvidiaAdapter: ProviderAdapter = {
  id: 'nvidia',
  label: 'NVIDIA',
  supportsText: true,
  supportsImages: true,
  async test(apiKey: string): Promise<ProviderResult> {
    const t0 = Date.now();
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - t0;
      if (!res.ok) return { ok: false, provider: 'nvidia', error: `HTTP ${res.status}`, latencyMs };
      return { ok: true, provider: 'nvidia', model: 'available', latencyMs };
    } catch (e) {
      return { ok: false, provider: 'nvidia', error: String(e), latencyMs: Date.now() - t0 };
    }
  },
};

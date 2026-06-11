import type { ProviderAdapter, ProviderResult } from './types';

export class ProviderRouter {
  private adapters: Map<string, ProviderAdapter> = new Map();

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  async test(providerId: string, apiKey: string): Promise<ProviderResult> {
    const adapter = this.adapters.get(providerId);
    if (!adapter) return { ok: false, provider: providerId, error: 'unknown provider' };
    return adapter.test(apiKey);
  }

  list(): { id: string; label: string }[] {
    return [...this.adapters.values()].map(a => ({ id: a.id, label: a.label }));
  }
}

export interface ProviderResult {
  ok: boolean;
  provider: string;
  model?: string;
  latencyMs?: number;
  error?: string;
}

export interface ProviderAdapter {
  id: string;
  label: string;
  supportsText: boolean;
  supportsImages: boolean;
  test(key: string): Promise<ProviderResult>;
}

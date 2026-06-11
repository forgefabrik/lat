import { describe, it, expect } from 'vitest';
import { ProviderRouter } from '../../providers/Router';
import { openrouterAdapter } from '../../providers/openrouter';
import { nvidiaAdapter } from '../../providers/nvidia';
import { kiloAdapter } from '../../providers/kilo';

describe('ProviderRouter', () => {
  it('registers adapters and lists them', () => {
    const r = new ProviderRouter();
    r.register(openrouterAdapter);
    r.register(nvidiaAdapter);
    r.register(kiloAdapter);
    expect(r.list().length).toBe(3);
    expect(r.list().map(x => x.id).sort()).toEqual(['kilo', 'nvidia', 'openrouter'].sort());
  });

  it('rejects unknown provider', async () => {
    const r = new ProviderRouter();
    const out = await r.test('does-not-exist', 'x');
    expect(out).toEqual({ ok: false, provider: 'does-not-exist', error: 'unknown provider' });
  });

  it('each adapter returns a uniform ProviderResult even on bad key', async () => {
    const r = new ProviderRouter();
    r.register(openrouterAdapter);
    r.register(nvidiaAdapter);
    r.register(kiloAdapter);
    for (const a of r.list()) {
      const out = await r.test(a.id, '');
      expect(out).toHaveProperty('ok', expect.any(Boolean));
      expect(out).toHaveProperty('provider', a.id);
      expect(out).toHaveProperty('latencyMs', expect.any(Number));
      if ('error' in out) expect(typeof (out as any).error).toBe('string');
    }
  });
});

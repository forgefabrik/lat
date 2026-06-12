import { describe, it, expect } from 'vitest';
import { validateGenerate } from '../image-worker/validate';

describe('image-worker validation', () => {
  it('accepts valid body', () => {
    const r = validateGenerate({ prompt: 'a frog', width: 256, height: 256, format: 'png' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.req.width).toBe(256);
      expect(r.req.height).toBe(256);
      expect(r.req.format).toBe('png');
    }
  });

  it('defaults and clamps', () => {
    const r = validateGenerate({ prompt: 'x' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.req.width).toBe(128);
      expect(r.req.height).toBe(128);
      expect(r.req.format).toBe('png');
    }
    const big = validateGenerate({ prompt: 'x', width: 9999 });
    if (big.ok) expect(big.req.width).toBe(2048);
  });

  it('rejects empty prompt', () => {
    expect(validateGenerate({}).ok).toBe(false);
    expect(validateGenerate({ prompt: '   ' }).ok).toBe(false);
  });

  it('rejects non-object body', () => {
    expect(validateGenerate(null).ok).toBe(false);
    expect(validateGenerate('hi').ok).toBe(false);
  });
});

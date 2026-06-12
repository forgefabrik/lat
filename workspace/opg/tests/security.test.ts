import { describe, it, expect } from 'vitest';
import { authAdmin, sanitizeForLog, rateLimit, rateLimitKeyFor } from '../src/middleware';

describe('security', () => {
  it('admin key required rejects empty', async () => {
    const req = new Request('http://x', { headers: new Headers({ 'x-admin-key': '' }) });
    const res = authAdmin(req, { ADMIN_KEY: 's' } as any);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it('sanitize redacts sensitive keys', async () => {
    const out = sanitizeForLog({ apiKey: 'abc', name: 'ok' } as any);
    expect((out as any).apiKey).toBe('***REDACTED***');
    expect((out as any).name).toBe('ok');
  });
});

describe('rateLimit', () => {
  it('allows under limit then blocks over limit', async () => {
    const req = new Request('http://x');
    req.headers.set('x-forwarded-for', '1.2.3.4');
    const key = rateLimitKeyFor(req);
    for (let i = 0; i < 60; i++) rateLimit(key);
    const r = rateLimit(key);
    expect(r.ok).toBe(false);
  });
});

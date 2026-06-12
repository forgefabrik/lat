const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const stores = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const w = stores.get(key);
  if (!w || w.reset < now) {
    const next = { count: 1, reset: now + RATE_LIMIT_WINDOW_MS };
    stores.set(key, next);
    return { ok: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  w.count += 1;
  if (w.count > RATE_LIMIT_MAX) return { ok: false, remaining: 0 };
  return { ok: true, remaining: RATE_LIMIT_MAX - w.count };
}

export function rateLimitKeyFor(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd || 'anon').split(',')[0].trim();
}

import type { Env } from '../env';

const ADMIN_KEY = (v: string | undefined) => (v ?? '').length > 0;

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const SK = ['apiKey', 'key', 'secret', 'password', 'token', 'authorization'];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SK.some((s) => k.toLowerCase().includes(s))) {
      out[k] = '***REDACTED***';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitize(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function authAdmin(req: Request, env: Env): Response | null {
  const key = req.headers.get('x-admin-key') || '';
  if (!ADMIN_KEY(env.ADMIN_KEY)) return new Response('admin disabled', { status: 503 });
  if (key !== env.ADMIN_KEY) return new Response('forbidden', { status: 403 });
  return null;
}

export function sanitizeForLog(input: unknown): unknown {
  if (input && typeof input === 'object') return sanitize(input as Record<string, unknown>);
  return input;
}

export async function signImageWorkerRequest(req: Request, env: Env): Promise<Request> {
  const secret = env.IMAGE_WORKER_SECRET;
  if (!secret) return req;
  const url = new URL(req.url);
  const ts = Date.now().toString();
  const payload = ts + url.pathname;
  // In production use WebCrypto HMAC; simplified here to header stamp
  const signed = new Request(req);
  signed.headers.set('X-Image-Worker-TS', ts);
  signed.headers.set('X-Image-Worker-Sig', btoa(payload + ':' + secret.slice(0, 8)));
  return signed;
}

export { ADMIN_KEY as requireAdminKey, ADMIN_KEY as isAdminConfigured };

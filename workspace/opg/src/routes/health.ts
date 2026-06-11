import type { Env } from '../env';

export async function handleHealth(_req: Request, env: Env): Promise<Response> {
  let db = 'unknown';
  try {
    const r = await env.OPG_DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    db = r?.ok === 1 ? 'ok' : 'degraded';
  } catch {
    db = 'error';
  }
  return Response.json({ status: 'ok', db, timestamp: Date.now() });
}


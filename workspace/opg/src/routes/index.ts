import { handleHealth } from './health';
import { ProviderRouter } from '../../providers/Router';
import { openrouterAdapter } from '../../providers/openrouter';
import { nvidiaAdapter } from '../../providers/nvidia';
import { kiloAdapter } from '../../providers/kilo';

import type { Env } from '../env';

// Singleton router - adapters registered once
let router: ProviderRouter | null = null;
function getRouter(): ProviderRouter {
  if (!router) {
    router = new ProviderRouter();
    router.register(openrouterAdapter);
    router.register(nvidiaAdapter);
    router.register(kiloAdapter);
  }
  return router;
}

export class Router {
  static async handle(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/api/health') return handleHealth(req, env);
    if (url.pathname === '/api/providers/test' && req.method === 'POST') {
      try {
        const body = (await req.json()) as { provider: string; apiKey: string };
        const result = await getRouter().test(body.provider, body.apiKey);
        return Response.json(result);
      } catch {
        return Response.json({ ok: false, provider: 'unknown', error: 'invalid request body' }, { status: 400 });
      }
    }
    if (url.pathname === '/api/providers' && req.method === 'GET') {
      return Response.json({ providers: getRouter().list() });
    }
    return new Response('not found', { status: 404 });
  }
}

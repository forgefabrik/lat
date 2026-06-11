import { handleHealth } from './health';

import type { Env } from '../env';

export class Router {
  static handle(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/api/health') return handleHealth(req, env);
    return Promise.resolve(new Response('not found', { status: 404 }));
  }
}

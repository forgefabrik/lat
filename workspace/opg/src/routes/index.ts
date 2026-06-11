import { handleHealth } from './health';
import { handleProviderTest, handleProviderList } from './providers';
import { handleGamesGenerate, handleIterate, handleExport } from './games';
import { handleJobEvents, handleJobStatus } from './jobs';
import { handlePreview, handlePixelContinue, handleAnimationGenerate, handleAssetRegenerate } from './assets';

import type { Env } from '../env';
import { GameAgentOrchestrator } from '../agents/GameAgentOrchestrator';

let orchestrator: GameAgentOrchestrator | null = null;
function getOrchestrator(env: Env): GameAgentOrchestrator {
  if (!orchestrator) orchestrator = new GameAgentOrchestrator(env);
  return orchestrator;
}

export class Router {
  static async handle(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;

    // Static routes
    if (url.pathname === '/api/health') return handleHealth(req, env);

    // Provider routes
    if (url.pathname === '/api/providers/test' && method === 'POST') return handleProviderTest(req, env);
    if (url.pathname === '/api/providers' && method === 'GET') return handleProviderList(req, env);

    // Game routes
    if (url.pathname === '/api/games/generate' && method === 'POST') {
      return handleGamesGenerate(req, env, getOrchestrator(env));
    }
    if (url.pathname === '/api/games/:gameId/iterate' && method === 'POST') {
      const m = url.pathname.match(/^\/api\/games\/([^/]+)\/iterate$/);
      if (!m) return new Response('bad game iterate path', { status: 400 });
      return handleIterate(req, env, m[1], getOrchestrator(env));
    }
    if (url.pathname === '/api/games/:gameId/export' && method === 'POST') {
      const m = url.pathname.match(/^\/api\/games\/([^/]+)\/export$/);
      if (!m) return new Response('bad export path', { status: 400 });
      return handleExport(req, env, m[1], getOrchestrator(env));
    }

    // Job events
    if (url.pathname.startsWith('/api/jobs/')) {
      const m = url.pathname.match(/^\/api\/jobs\/([^/]+)(?:\/([^/]+))?$/);
      if (m && m[2] === 'events') return handleJobEvents(req, env, m[1]);
      if (m) return handleJobStatus(req, env, m[1]);
    }

    // Asset routes
    if (url.pathname === '/api/animations/generate' && method === 'POST') return handleAnimationGenerate(req, env);
    if (url.pathname.match(/^\/api\/pixel-documents\/[^/]+\/continue$/)) return handlePixelContinue(req, env);
    if (url.pathname.match(/^\/api\/assets\/[^/]+\/regenerate$/)) return handleAssetRegenerate(req, env);

    // Preview
    if (url.pathname.match(/^\/api\/games\/[^/]+\/preview$/)) return handlePreview(req, env);

    return new Response('not found', { status: 404 });
  }
}



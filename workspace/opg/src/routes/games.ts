import type { Env } from '../env';
import { GameAgentOrchestrator } from '../agents/GameAgentOrchestrator';

export async function handleGamesGenerate(req: Request, env: Env, orch: GameAgentOrchestrator): Promise<Response> {
  const body = (await req.json()) as {
    idea: string; provider: string; apiKey: string; style?: string; template?: string; quality?: string;
  };
  const gameId = crypto.randomUUID();
  await env.OPG_DB.prepare(
    'INSERT INTO games (id, idea, provider, style, template, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    gameId, body.idea, body.provider, body.style || 'snes', body.template || 'auto', 'queued', Date.now(), Date.now()
  ).run();

  await env.OPG_QUEUE.send({
    type: 'generate_game',
    gameId,
    provider: body.provider,
    apiKey: body.apiKey,
    idea: body.idea,
    style: body.style || 'snes',
    template: body.template || 'auto',
    quality: body.quality || 'high',
  });

  return Response.json({ gameId, status: 'queued' });
}

export async function handleIterate(req: Request, env: Env, gameId: string, orch: GameAgentOrchestrator): Promise<Response> {
  const body = (await req.json()) as { provider: string; apiKey: string; request: string };
  await orch.iterate(gameId, body);
  return Response.json({ gameId, status: 'iterating' });
}

export async function handleExport(req: Request, env: Env, gameId: string, _orch: GameAgentOrchestrator): Promise<Response> {
  const { results } = await env.OPG_DB.prepare('SELECT * FROM builds WHERE game_id = ?').bind(gameId).all();
  return Response.json({ gameId, builds: results });
}

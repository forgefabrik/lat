import type { Env } from '../env';

export async function handleAdminStats(_req: Request, env: Env): Promise<Response> {
  const games = (await env.OPG_DB.prepare('SELECT COUNT(*) as count FROM games').first()) as { count: number };
  const builds = (await env.OPG_DB.prepare('SELECT COUNT(*) as count FROM builds').first()) as { count: number };
  const jobRows = (await env.OPG_DB.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status').all()) as { results: { status: string; count: number }[] };

  const jobStats: Record<string, number> = {};
  let jobTotal = 0;
  for (const row of jobRows.results) {
    jobStats[row.status] = row.count;
    jobTotal += row.count;
  }

  return Response.json({
    games: games.count,
    builds: builds.count,
    jobs: { total: jobTotal, ...jobStats },
  });
}

export async function handleAdminJobs(_req: Request, env: Env): Promise<Response> {
  const { results } = (await env.OPG_DB.prepare(
    `SELECT j.id, j.game_id, j.type, j.status, j.progress, j.message, j.created_at, g.idea
     FROM jobs j
     LEFT JOIN games g ON j.game_id = g.id
     ORDER BY j.created_at DESC
     LIMIT 50`
  ).all()) as { results: any[] };

  return Response.json({ jobs: results });
}

export async function handleAdminJobRetry(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const match = url.pathname.match(/^\/api\/admin\/jobs\/([^/]+)\/retry$/);
  if (!match) return new Response('bad path', { status: 400 });

  const jobId = match[1];
  const job = (await env.OPG_DB.prepare('SELECT * FROM jobs WHERE id = ?').bind(jobId).first()) as any;
  if (!job) return new Response('job not found', { status: 404 });

  await env.OPG_DB.prepare(
    'UPDATE jobs SET status = ?, progress = ?, message = ?, updated_at = ? WHERE id = ?'
  ).bind('queued', 0, 'Retrying', Date.now(), jobId).run();

  return Response.json({ jobId, status: 'queued' });
}

export async function handleAdminQueue(_req: Request, env: Env): Promise<Response> {
  // Queue depth stats backed by jobs table (authoritative source of work in repo)
  const queued = (await env.OPG_DB.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = "queued"').first()) as { count: number };
  const running = (await env.OPG_DB.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = "running"').first()) as { count: number };

  return Response.json({
    queue: 'OPG_QUEUE',
    queued: queued.count,
    running: running.count,
  });
}

import type { Env } from '../env';

export async function handleJobStatus(req: Request, env: Env, jobId: string): Promise<Response> {
  const row = await env.OPG_DB.prepare('SELECT * FROM jobs WHERE id = ?').bind(jobId).first();
  if (!row) return new Response('not found', { status: 404 });
  return Response.json(row);
}

export async function handleJobEvents(req: Request, env: Env, jobId: string): Promise<Response> {
  const url = new URL(req.url);
  const accept = req.headers.get('accept') || '';

  if (accept.includes('text/event-stream')) {
    const { results } = await env.OPG_DB.prepare(
      'SELECT * FROM agent_events WHERE job_id = ? ORDER BY created_at ASC LIMIT 50'
    ).bind(jobId).all();

    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        const send = (data: string) => controller.enqueue(enc.encode(`data:${data}\n\n`));
        send('{"type":"session_start"}');
        for (const r of results as any[]) {
          send(JSON.stringify({ type: r.event_type, agent: r.agent, payload: JSON.parse(r.payload_json || '{}'), at: r.created_at }));
        }
        send('{"type":"session_end"}');
        controller.enqueue(enc.encode('data:[DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' },
    });
  }

  const { results } = await env.OPG_DB.prepare(
    'SELECT * FROM agent_events WHERE job_id = ? ORDER BY created_at ASC LIMIT 200'
  ).bind(jobId).all();

  return Response.json({ events: results });
}

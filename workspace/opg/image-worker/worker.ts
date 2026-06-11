export interface Env {
  AI: Ai;
  IMAGE_WORKER_SECRET: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('method not allowed', { status: 405 });
    }
    const auth = req.headers.get('x-image-worker-secret');
    if (auth !== env.IMAGE_WORKER_SECRET) {
      return new Response('unauthorized', { status: 401 });
    }
    // Real implementation in opg-agents.md (Milestone 9)
    return new Response(JSON.stringify({ error: 'not implemented yet', hint: 'Milestone 9' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    });
  },
} satisfies ExportedHandler<Env>;

import { describe, it, expect } from 'vitest';
import { Router } from '../../src/routes';

const makeStmt = () => ({
  bind: (..._args: any[]) => ({
    first: async () => ({ count: 42 }),
    all: async () => ({ results: [] }),
    run: async () => ({ lastInsertRowid: 1, changes: 1 }),
  }),
  first: async () => ({ count: 42 }),
  all: async () => ({ results: [] }),
  run: async () => ({ lastInsertRowid: 1, changes: 1 }),
});

const mockEnv = {
  OPG_DB: {
    prepare: (_sql: string) => makeStmt(),
  },
  OPG_ASSETS: { put: async () => {} },
  OPG_KV: { get: async () => null },
  OPG_QUEUE: { send: async () => {} },
  ASSETS: { fetch: async () => new Response('ok') },
} as any;

function makeReq(path: string, method = 'GET', body?: any) {
  return {
    url: `http://localhost${path}`,
    method,
    json: async () => body ?? {},
    headers: new Headers(),
  } as any;
}

describe('Router admin routes', () => {
  it('returns stats from /api/admin/stats', async () => {
    const res = await Router.handle(makeReq('/api/admin/stats', 'GET'), mockEnv);
    expect(res.status).toBe(200);
    const text = await res.text();
    const data = JSON.parse(text);
    expect(data).toHaveProperty('games');
    expect(data).toHaveProperty('builds');
    expect(data).toHaveProperty('jobs');
  });

  it('returns jobs list from /api/admin/jobs', async () => {
    const res = await Router.handle(makeReq('/api/admin/jobs', 'GET'), mockEnv);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('jobs');
    expect(Array.isArray(data.jobs)).toBe(true);
  });

  it('returns queue stats from /api/admin/queue', async () => {
    const res = await Router.handle(makeReq('/api/admin/queue', 'GET'), mockEnv);
    expect(res.status).toBe(200);
    const text = await res.text();
    const data = JSON.parse(text);
    expect(data).toHaveProperty('queue');
    expect(data).toHaveProperty('queued');
    expect(data).toHaveProperty('running');
  });

  it('retries job via /api/admin/jobs/:id/retry', async () => {
    const res = await Router.handle(makeReq('/api/admin/jobs/job-123/retry', 'POST'), mockEnv);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobId).toBe('job-123');
    expect(data.status).toBe('queued');
  });

  it('rejects non-post retry', async () => {
    const res = await Router.handle(makeReq('/api/admin/jobs/job-123/retry', 'GET'), mockEnv);
    expect(res.status).toBe(404);
  });
});

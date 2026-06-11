import type { Env } from '../env';

export class GameAgentOrchestrator {
  constructor(private env: Env) {}

  async run(gameId: string, input: { provider: string; apiKey: string; idea: string; style: string; template: string; quality: string }) {
    const jobId = crypto.randomUUID();
    await this.env.OPG_DB.prepare(
      'INSERT INTO jobs (id, game_id, type, status, progress, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(jobId, gameId, 'generate', 'running', 0, 'Starting', Date.now(), Date.now()).run();

    await this.emit(gameId ?? null, jobId, 'agent.message', { agent: 'GameDesignerAgent', message: 'Analysing idea...' });
    await this.env.OPG_DB.prepare('UPDATE jobs SET progress = ?, message = ? WHERE id = ?').bind(100, 'Done', jobId).run();
    await this.emit(gameId ?? null, jobId, 'job.completed', { gameId });
    return { jobId };
  }

  async iterate(gameId: string, body: { provider: string; apiKey: string; request: string }) {
    const jobId = crypto.randomUUID();
    await this.env.OPG_DB.prepare(
      'INSERT INTO jobs (id, game_id, type, status, progress, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(jobId, gameId, 'iterate', 'running', 0, 'Iterating', Date.now(), Date.now()).run();
    await this.emit(gameId, jobId, 'agent.message', { agent: 'GameDesignerAgent', message: 'Iterating...' });
    await this.env.OPG_DB.prepare('UPDATE jobs SET progress = ?, message = ? WHERE id = ?').bind(100, 'Done', jobId).run();
    await this.emit(gameId, jobId, 'job.completed', { gameId });
    return { jobId };
  }

  private async emit(gameId: string | null, jobId: string, eventType: string, payload: Record<string, unknown>) {
    await this.env.OPG_DB.prepare(
      'INSERT INTO agent_events (id, job_id, game_id, agent, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), jobId, gameId, payload.agent as string || 'system', eventType, JSON.stringify(payload), Date.now()).run();
  }
}

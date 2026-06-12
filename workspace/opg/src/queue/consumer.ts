import type { Env } from '../env';
import { GameDesignerAgent } from '../agents/GameDesignerAgent';
import { AssetPlannerAgent } from '../agents/AssetPlannerAgent';
import { LevelDesignerAgent } from '../agents/LevelDesignerAgent';
import { buildGame } from '../engine/buildGame';
import { validateGameSpec } from '../engine/GameSpec';

export interface QueueMessage {
  type: string;
  gameId: string;
  provider: string;
  apiKey: string;
  idea: string;
  style: string;
  template: string;
  quality: string;
}

export class OPQueueConsumer {
  constructor(private env: Env) {}

  async consume(batch: MessageBatch<QueueMessage>): Promise<void> {
    for (const msg of batch.messages) {
      const m = msg.body;
      if (m.type !== 'generate_game') {
        msg.ack();
        continue;
      }

      const designer = new GameDesignerAgent(this.env);

      try {
        await this.updateJob(m.gameId, 'running', 10, 'Designing game...');
        const spec = await designer.design(m);
        const validation = validateGameSpec(spec);
        if (!validation.ok) {
          await this.emit(m.gameId, '(job)', 'validation.error', { errors: validation.errors });
          await this.updateJob(m.gameId, 'failed', 0, 'Invalid spec');
          msg.ack();
          continue;
        }

        await this.emit(m.gameId, '(job)', 'agent.started', { agent: 'AssetPlannerAgent', message: 'Planning assets...' });
        const planner = new AssetPlannerAgent(this.env);
        await planner.plan(spec, m.gameId);

        await this.emit(m.gameId, '(job)', 'agent.started', { agent: 'LevelDesignerAgent', message: 'Generating level...' });
        const levelAgent = new LevelDesignerAgent(this.env);
        await levelAgent.generate(spec, m.gameId);

        await this.emit(m.gameId, '(job)', 'agent.started', { agent: 'CodeBuilderAgent', message: 'Building game...' });
        const build = await buildGame(spec, this.env);
        await this.saveBuild(build, m.gameId);

        await this.updateJob(m.gameId, 'completed', 100, 'Done');
        await this.emit(m.gameId, '(job)', 'job.completed', { gameId: m.gameId, buildId: build.gameId });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown';
        await this.updateJob(m.gameId, 'failed', 0, message);
        await this.emit(m.gameId, '(job)', 'job.failed', { error: message });
      }

      msg.ack();
    }
  }

  private async emit(gameId: string, jobId: string, eventType: string, payload: Record<string, unknown>) {
    await this.env.OPG_DB.prepare(
      'INSERT INTO agent_events (id, job_id, game_id, agent, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), jobId, gameId, (payload.agent as string) || 'system', eventType, JSON.stringify(payload), Date.now()).run();
  }

  private async saveBuild(build: { gameId: string; r2Prefix: string; files: { path: string; content: Uint8Array }[] }, gameId: string) {
    const buildId = crypto.randomUUID();
    for (const f of build.files) {
      await this.env.OPG_ASSETS.put(f.path, f.content, {
        httpMetadata: {
          contentType: f.path.endsWith('.html') ? 'text/html' : (f.path.endsWith('.json') ? 'application/json' : 'application/octet-stream'),
        },
      });
    }
    await this.env.OPG_DB.prepare(
      'INSERT INTO builds (id, game_id, r2_key, status, manifest_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(buildId, gameId, `${build.r2Prefix}index.html`, 'ready', JSON.stringify(build), Date.now()).run();
  }

  private async updateJob(gameId: string, status: string, progress: number, message: string) {
    await this.env.OPG_DB.prepare('UPDATE jobs SET status=?, progress=?, message=?, updated_at=? WHERE game_id=? AND status != ?')
      .bind(status, progress, message, Date.now(), gameId, 'completed').run();
  }
}
